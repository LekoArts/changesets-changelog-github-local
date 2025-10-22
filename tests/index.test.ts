import type { ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import changelogFunctions from '../src/index'

// Create mock functions that we can access in our tests
const mockMessageFn = vi.fn()
const mockFindCommitFn = vi.fn(() => ({
  message: mockMessageFn,
}))

// Mock the @napi-rs/simple-git Repository functionality
vi.mock('@napi-rs/simple-git', () => ({
  Repository: {
    discover: vi.fn(() => ({
      findCommit: mockFindCommitFn,
      isShallow: () => false,
    })),
  },
}))

describe('changelogFunctions', () => {
  const validOptions = { repo: 'owner/repo' }

  beforeEach(() => {
    // Reset mocks between tests
    vi.clearAllMocks()
    mockMessageFn.mockReset()
  })

  describe('getDependencyReleaseLine', () => {
    it('returns empty string when no dependencies are updated', async () => {
      const result = await changelogFunctions.getDependencyReleaseLine([], [], validOptions)
      expect(result).toBe('')
    })

    it('formats dependency updates correctly with commit info', async () => {
      const changesets: NewChangesetWithCommit[] = [
        {
          id: 'changeset-1',
          commit: 'abc1234567890',
          summary: 'A summary',
          releases: [{ name: 'pkg-1', type: 'minor' }],
        },
        {
          id: 'changeset-2',
          commit: 'def1234567890',
          summary: 'Another summary',
          releases: [{ name: 'pkg-2', type: 'patch' }],
        },
      ]

      const dependenciesUpdated: ModCompWithPackage[] = [
        {
          name: 'pkg-1',
          newVersion: '1.0.0',
          oldVersion: '0.9.0',
          type: 'minor',
          changesets: ['changeset-1'],
          packageJson: { name: 'pkg-1', version: '1.0.0' },
          dir: 'packages/pkg-1',
        },
        {
          name: 'pkg-2',
          newVersion: '2.0.0',
          oldVersion: '1.9.0',
          type: 'patch',
          changesets: ['changeset-2'],
          packageJson: { name: 'pkg-2', version: '2.0.0' },
          dir: 'packages/pkg-2',
        },
      ]

      const result = await changelogFunctions.getDependencyReleaseLine(changesets, dependenciesUpdated, validOptions)

      expect(result).toContain('- Updated dependencies [[`abc1234`](https://github.com/owner/repo/commit/abc1234567890), [`def1234`](https://github.com/owner/repo/commit/def1234567890)]:')
      expect(result).toContain('  - pkg-1@1.0.0')
      expect(result).toContain('  - pkg-2@2.0.0')
    })

    it('formats one dependency update correctly', async () => {
      const changesets: NewChangesetWithCommit[] = [
        {
          id: 'changeset-1',
          commit: 'abc1234567890',
          summary: 'A summary',
          releases: [{ name: 'pkg-1', type: 'minor' }],
        },
      ]

      const dependenciesUpdated: ModCompWithPackage[] = [
        {
          name: 'pkg-1',
          newVersion: '1.0.0',
          oldVersion: '0.9.0',
          type: 'minor',
          changesets: ['changeset-1'],
          packageJson: { name: 'pkg-1', version: '1.0.0' },
          dir: 'packages/pkg-1',
        },
      ]

      const result = await changelogFunctions.getDependencyReleaseLine(changesets, dependenciesUpdated, validOptions)

      expect(result).toContain('- Updated dependencies [[`abc1234`](https://github.com/owner/repo/commit/abc1234567890)]:')
      expect(result).toContain('  - pkg-1@1.0.0')
    })

    it('handles updates without changesets', async () => {
      const changesets: NewChangesetWithCommit[] = []

      const dependenciesUpdated: ModCompWithPackage[] = [
        {
          name: 'pkg-1',
          newVersion: '1.0.0',
          oldVersion: '0.9.0',
          type: 'minor',
          changesets: ['changeset-1'],
          packageJson: { name: 'pkg-1', version: '1.0.0' },
          dir: 'packages/pkg-1',
        },
      ]

      const result = await changelogFunctions.getDependencyReleaseLine(changesets, dependenciesUpdated, validOptions)

      expect(result).toContain('- Updated dependencies:')
      expect(result).toContain('  - pkg-1@1.0.0')
    })

    it('handles changesets without commits', async () => {
      const changesets: NewChangesetWithCommit[] = [
        {
          id: 'changeset-1',
          summary: 'A summary',
          releases: [{ name: 'pkg', type: 'minor' }],
        },
        {
          id: 'changeset-2',
          commit: 'def1234567890',
          summary: 'Another summary',
          releases: [{ name: 'pkg', type: 'patch' }],
        },
      ]

      const dependenciesUpdated: ModCompWithPackage[] = [
        {
          name: 'pkg',
          newVersion: '1.0.0',
          oldVersion: '0.9.0',
          type: 'minor',
          changesets: ['changeset-1', 'changeset-2'],
          packageJson: { name: 'pkg', version: '1.0.0' },
          dir: 'packages/pkg',
        },
      ]

      const result = await changelogFunctions.getDependencyReleaseLine(changesets, dependenciesUpdated, validOptions)

      expect(result).toContain('- Updated dependencies [[`def1234`](https://github.com/owner/repo/commit/def1234567890)]:')
      expect(result).toContain('  - pkg@1.0.0')
    })

    it('throws error with invalid options', async () => {
      const mockDeps: ModCompWithPackage[] = [{
        name: 'pkg',
        newVersion: '1.0.0',
        oldVersion: '0.9.0',
        type: 'patch',
        changesets: [],
        packageJson: { name: 'pkg', version: '1.0.0' },
        dir: 'packages/pkg',
      }]

      await expect(() =>
        changelogFunctions.getDependencyReleaseLine([], mockDeps, {}),
      ).rejects.toThrow('Please provide a repo')
    })
  })

  describe('getReleaseLine', () => {
    it('formats release line correctly with PR number', async () => {
      mockMessageFn.mockReturnValue('Fix a bug (#123)')

      const changeset: NewChangesetWithCommit = {
        summary: 'Fix a bug',
        commit: 'abc1234567890',
        id: 'changeset-1',
        releases: [{ name: 'pkg', type: 'patch' }],
      }

      const result = await changelogFunctions.getReleaseLine(changeset, 'patch', validOptions)

      expect(result).toBe('\n- Fix a bug ([#123](https://github.com/owner/repo/pull/123))\n')
      expect(mockFindCommitFn).toHaveBeenCalledWith('abc1234567890')
    })

    it('formats release line correctly with commit SHA when no PR number is found', async () => {
      mockMessageFn.mockReturnValue('Fix a bug')

      const changeset: NewChangesetWithCommit = {
        summary: 'Fix a bug',
        commit: 'abc1234567890',
        id: 'changeset-1',
        releases: [{ name: 'pkg', type: 'patch' }],
      }

      const result = await changelogFunctions.getReleaseLine(changeset, 'patch', validOptions)

      expect(result).toBe('\n- Fix a bug ([`abc1234`](https://github.com/owner/repo/commit/abc1234567890))\n')
    })

    it('handles multiline summaries correctly', async () => {
      mockMessageFn.mockReturnValue('Add new feature (#456)')

      const changeset: NewChangesetWithCommit = {
        summary: 'Add new feature\nWith detailed description\nAnd more details',
        commit: 'abc1234567890',
        id: 'changeset-1',
        releases: [{ name: 'pkg', type: 'minor' }],
      }

      const result = await changelogFunctions.getReleaseLine(changeset, 'minor', validOptions)

      expect(result).toBe('\n- Add new feature ([#456](https://github.com/owner/repo/pull/456))\n  With detailed description\n  And more details')
    })

    it('cleans summary before using it', async () => {
      mockMessageFn.mockReturnValue('Add feature (#789)')

      const changeset: NewChangesetWithCommit = {
        summary: 'PR: #123 Add feature\ncommit: def456\nauthor: @user',
        commit: 'abc1234567890',
        id: 'changeset-1',
        releases: [{ name: 'pkg', type: 'minor' }],
      }

      const result = await changelogFunctions.getReleaseLine(changeset, 'minor', validOptions)

      expect(result).toBe('\n- Add feature ([#789](https://github.com/owner/repo/pull/789))\n')
    })

    it('handles errors when getting commit message', async () => {
      // Temporarily spy on console.warn to suppress the output
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Simulate an error when finding commit
      mockFindCommitFn.mockImplementationOnce(() => {
        throw new Error('Git error')
      })

      const changeset: NewChangesetWithCommit = {
        summary: 'Fix a bug',
        commit: 'abc1234567890',
        id: 'changeset-1',
        releases: [{ name: 'pkg', type: 'patch' }],
      }

      // We expect it to continue despite the error and use the commit hash
      const result = await changelogFunctions.getReleaseLine(changeset, 'patch', validOptions)

      expect(result).toBe('\n- Fix a bug ([`abc1234`](https://github.com/owner/repo/commit/abc1234567890))\n')

      // Verify the warning was logged (but suppressed from output)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to get commit message for abc1234567890:',
        expect.any(Error),
      )

      // Restore the original console.warn
      consoleWarnSpy.mockRestore()
    })

    it('handles changesets without commits', async () => {
      const changeset: NewChangesetWithCommit = {
        summary: 'Fix a bug',
        id: 'changeset-1',
        releases: [{ name: 'pkg', type: 'patch' }],
      }

      const result = await changelogFunctions.getReleaseLine(changeset, 'patch', validOptions)

      expect(result).toBe('\n- Fix a bug\n')
      expect(mockFindCommitFn).not.toHaveBeenCalled()
    })

    it('throws error with invalid options', async () => {
      const changeset: NewChangesetWithCommit = {
        summary: 'Fix a bug',
        id: 'changeset-1',
        releases: [{ name: 'pkg', type: 'patch' }],
      }

      await expect(() =>
        changelogFunctions.getReleaseLine(changeset, 'patch', {}),
      ).rejects.toThrow('Please provide a repo')
    })
  })
})
