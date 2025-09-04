import type { ValidOptions } from '../src/types'
import { describe, expect, it } from 'vitest'
import { cleanSummary, getCommitUrl, getPrNumber, getPrUrl, getRepoUrl, getShortSha, getSuffix, validate } from '../src/_utils'

describe('_utils', () => {
  describe('getRepoUrl', () => {
    it('returns the GitHub URL for the repo', () => {
      const options: ValidOptions = { repo: 'owner/repo' }
      expect(getRepoUrl(options)).toBe('https://github.com/owner/repo')
    })
  })

  describe('getCommitUrl', () => {
    it('returns the GitHub commit URL', () => {
      const options: ValidOptions = { repo: 'owner/repo' }
      const commitHash = '1234567890abcdef'
      expect(getCommitUrl(options, commitHash)).toBe('https://github.com/owner/repo/commit/1234567890abcdef')
    })
  })

  describe('getPrUrl', () => {
    it('returns the GitHub pull request URL', () => {
      const options: ValidOptions = { repo: 'owner/repo' }
      const prNumber = 123
      expect(getPrUrl(options, prNumber)).toBe('https://github.com/owner/repo/pull/123')
    })

    it('works with different PR numbers', () => {
      const options: ValidOptions = { repo: 'owner/repo' }
      expect(getPrUrl(options, 1)).toBe('https://github.com/owner/repo/pull/1')
      expect(getPrUrl(options, 999)).toBe('https://github.com/owner/repo/pull/999')
    })
  })

  describe('getShortSha', () => {
    it('returns the first 7 characters of the commit hash', () => {
      const commitHash = '1234567890abcdef'
      expect(getShortSha(commitHash)).toBe('1234567')
    })
  })

  describe('cleanSummary', () => {
    it('removes PR prefix', () => {
      expect(cleanSummary('PR: #123 Add new feature')).toBe('Add new feature')
      expect(cleanSummary('pr: #456 Fix bug')).toBe('Fix bug')
      expect(cleanSummary('pull request: #789 Update docs')).toBe('Update docs')
    })

    it('removes commit prefix', () => {
      expect(cleanSummary('commit: abc123 Add feature')).toBe('Add feature')
    })

    it('removes author prefix', () => {
      expect(cleanSummary('author: @user Add feature')).toBe('Add feature')
      expect(cleanSummary('user: johndoe Update docs')).toBe('Update docs')
    })

    it('handles multiple prefixes', () => {
      const input = 'pr: #123\ncommit: abc123\nauthor: @user\nAdd feature'
      expect(cleanSummary(input)).toBe('Add feature')
    })

    it('trims whitespace', () => {
      expect(cleanSummary('  pr: #123 Add feature  ')).toBe('Add feature')
    })

    it('returns original string if no prefixes found', () => {
      const input = 'This is a plain summary'
      expect(cleanSummary(input)).toBe(input)
    })
  })

  describe('getPrNumber', () => {
    it('extracts PR number from basic PR reference at the end', () => {
      const msg = 'fix: Correct the API endpoint (#123)'
      expect(getPrNumber(msg)).toBe(123)
    })

    it('extracts PR number when there are other references', () => {
      const msg = 'feat: Add new feature (closes #456) (#789)'
      expect(getPrNumber(msg)).toBe(789)
    })

    it('returns undefined when there is no PR number', () => {
      const msg = 'docs: Update README'
      expect(getPrNumber(msg)).toBe(undefined)
    })

    it('extracts PR number from GitHub squash merge format', () => {
      const msg = 'Add feature (#123)\n\nThis is a detailed description'
      expect(getPrNumber(msg)).toBe(123)
    })

    it('extracts PR number without parentheses at the end', () => {
      const msg = 'fix: Update dependency #42'
      expect(getPrNumber(msg)).toBe(42)
    })

    it('extracts PR number with trailing spaces', () => {
      const msg = 'chore: Update lockfile (#88)  '
      expect(getPrNumber(msg)).toBe(88)
    })

    it('extracts PR number when there are multiple references', () => {
      const msg = 'fix: Related to (#22) but actually fixes (#33)'
      expect(getPrNumber(msg)).toBe(33)
    })

    it('returns undefined for non-numeric references', () => {
      const msg = 'docs: Update README (#abc)'
      expect(getPrNumber(msg)).toBe(undefined)
    })

    it('ignores PR numbers not in the first line', () => {
      const msg = 'feat: Add new feature\n\nResolves #456'
      expect(getPrNumber(msg)).toBe(undefined)
    })

    it('handles multiline commit messages correctly', () => {
      const msg = 'fix: Update dependencies (#789)\n\nThis is a detailed description\nWith multiple lines\nAnd a reference to #123'
      expect(getPrNumber(msg)).toBe(789)
    })
  })

  describe('getSuffix', () => {
    const options: ValidOptions = { repo: 'owner/repo' }

    it('returns PR link when PR number is available', () => {
      const pr = 123
      const commitSha = '1234567890abcdef'
      expect(getSuffix(pr, commitSha, options)).toBe(' ([#123](https://github.com/owner/repo/pull/123))')
    })

    it('returns commit link when only commit SHA is available', () => {
      const pr = undefined
      const commitSha = '1234567890abcdef'
      expect(getSuffix(pr, commitSha, options)).toBe(' ([`1234567`](https://github.com/owner/repo/commit/1234567890abcdef))')
    })

    it('returns empty string when neither PR nor commit is available', () => {
      const pr = undefined
      const commitSha = undefined
      expect(getSuffix(pr, commitSha, options)).toBe('')
    })

    it('prioritizes PR number over commit SHA when both are available', () => {
      const pr = 123
      const commitSha = '1234567890abcdef'
      const result = getSuffix(pr, commitSha, options)
      expect(result).toContain('#123')
      expect(result).not.toContain('1234567')
    })
  })

  describe('validate', () => {
    it('does not throw for valid options', () => {
      const options = { repo: 'owner/repo' }
      expect(() => validate(options)).not.toThrow()
    })

    it('throws when options is null', () => {
      expect(() => validate(null)).toThrow(
        'Please provide a repo for this changelog generator.\n"example": ["changesets-changelog-github-local", { "repo": "org/repo" }]',
      )
    })

    it('throws when options.repo is missing', () => {
      const options = {}
      expect(() => validate(options)).toThrow(
        'Please provide a repo for this changelog generator.\n"example": ["changesets-changelog-github-local", { "repo": "org/repo" }]',
      )
    })

    it('throws when options.repo is not a string', () => {
      const options = { repo: 123 }
      expect(() => validate(options)).toThrow('Invalid repo format. Please use the format "org/repo"')
    })

    it('throws when options.repo is not in the format "org/repo"', () => {
      const invalidFormats = [
        'owner', // Missing slash
        '/repo', // Missing org
        'owner/', // Missing repo
        'owner/repo/extra', // Too many path segments
        'owner repo', // Space instead of slash
        ' owner/repo', // Leading whitespace
        'owner/repo ', // Trailing whitespace
      ]

      invalidFormats.forEach((invalidFormat) => {
        expect(() => validate({ repo: invalidFormat })).toThrow('Invalid repo format. Please use the format "org/repo"')
      })
    })

    it('works as a type-guard', () => {
      // This test is primarily for TypeScript to check that validate works as a type-guard
      // The actual runtime behavior is tested in other tests
      const options: Record<string, any> = { repo: 'owner/repo' }
      validate(options)
      // After validate, TypeScript knows that options is ValidOptions
      // This would cause a TypeScript error if validate wasn't a type-guard
      const repoUrl: string = getRepoUrl(options)
      expect(repoUrl).toBe('https://github.com/owner/repo')
    })
  })
})
