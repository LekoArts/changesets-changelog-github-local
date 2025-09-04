import type { ValidOptions } from './types'
import { Repository } from '@napi-rs/simple-git'
import { CWD } from './constants'

/**
 * Constructs a GitHub repository URL from the options
 *
 * @example
 * ```ts
 * const options = { repo: 'owner/repo' };
 * const url = getRepoUrl(options); // Returns "https://github.com/owner/repo"
 * ```
 */
export function getRepoUrl(options: ValidOptions): string {
  return `https://github.com/${options.repo}`
}

/**
 * Constructs a GitHub commit URL from the options and commit hash
 *
 * @example
 * ```ts
 * const options = { repo: 'owner/repo' };
 * const commitHash = '1234567890abcdef';
 * const url = getCommitUrl(options, commitHash);
 * // Returns "https://github.com/owner/repo/commit/1234567890abcdef"
 * ```
 */
export function getCommitUrl(options: ValidOptions, commitHash: string): string {
  return `${getRepoUrl(options)}/commit/${commitHash}`
}

/**
 * Constructs a GitHub pull request URL from the options and PR number
 *
 * @example
 * ```ts
 * const options = { repo: 'owner/repo' };
 * const prNumber = 123;
 * const url = getPrUrl(options, prNumber);
 * // Returns "https://github.com/owner/repo/pull/123"
 * ```
 */
export function getPrUrl(options: ValidOptions, prNumber: number): string {
  return `${getRepoUrl(options)}/pull/${prNumber}`
}

/**
 * Returns a shortened version of the commit hash (first 7 characters)
 *
 * @example
 * ```ts
 * const hash = '1234567890abcdef';
 * const shortHash = getShortSha(hash); // Returns "1234567"
 * ```
 */
export function getShortSha(commitHash: string): string {
  return commitHash.slice(0, 7)
}

/**
 * Regular expression to validate the 'owner/repo' format
 * Matches a string with exactly one forward slash separating non-whitespace characters
 */
const ORG_REPO_REGEX = /^[^/\s]+\/[^/\s]+$/

/**
 * Validates that the options object contains a properly formatted repo property
 * This function is a TypeScript type guard that asserts options is ValidOptions
 *
 * @example
 * ```ts
 * // Valid usage:
 * const options = { repo: 'owner/repo' };
 * validate(options);
 * // After this call, TypeScript knows options is of type ValidOptions
 *
 * // Invalid usage that will throw:
 * validate(null); // Error: Please provide a repo...
 * validate({}); // Error: Please provide a repo...
 * validate({ repo: 'invalid-format' }); // Error: Invalid repo format...
 * ```
 */
export function validate(options: Record<string, any> | null): asserts options is ValidOptions {
  if (!options || !options.repo) {
    throw new Error(
      'Please provide a repo for this changelog generator.\n"example": ["changesets-changelog-github-local", { "repo": "org/repo" }]',
    )
  }

  if (typeof options.repo !== 'string' || !ORG_REPO_REGEX.test(options.repo)) {
    throw new Error(
      'Invalid repo format. Please use the format "org/repo"',
    )
  }
}

/**
 * Discovers and initializes a git repository from the current working directory
 *
 * @example
 * ```ts
 * // Get the repository instance
 * const repository = getRepository();
 *
 * // Use it to find commits or other git operations
 * const commit = repository.findCommit('1234567890abcdef');
 * const message = commit.message();
 * ```
 */
export function getRepository(): Repository {
  try {
    const repository = Repository.discover(CWD)

    if (repository.isShallow()) {
      if (process.env.GITHUB_ACTION) {
        console.warn('The repository is shallow cloned, so PR links may not work. See https://github.com/actions/checkout#fetch-all-history-for-all-tags-and-branches to fetch all the history.')
      }
      else {
        console.warn('The repository is shallow cloned, so PR links may not work.')
      }
    }

    return repository
  }
  catch (error) {
    throw new Error(`Repository.discover failed: ${(error as Error).message}`)
  }
}

/**
 * This function cleans the changeset.summary string by removing any "pr:", "commit:", or "author:" lines.
 */
export function cleanSummary(summary: string) {
  return summary
    .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, '')
    .replace(/^\s*commit:\s*(\S+)/im, '')
    .replace(/^\s*(?:author|user):\s*@?(\S+)/gim, '')
    .trim()
}

/**
 * Extracts the PR number from a commit message.
 * Handles different formats of squash merge commit messages.
 *
 * @example
 * ```ts
 * // Basic PR reference at the end
 * const msg1 = "fix: Correct the API endpoint (#123)";
 * getPrNumber(msg1); // Returns 123
 *
 * // PR reference with other references
 * const msg2 = "feat: Add new feature (closes #456) (#789)";
 * getPrNumber(msg2); // Returns 789
 *
 * // No PR number
 * const msg3 = "docs: Update README";
 * getPrNumber(msg3); // Returns undefined
 *
 * // GitHub's squash merge format
 * const msg4 = "Add feature (#123)\n\nThis is a detailed description";
 * getPrNumber(msg4); // Returns 123
 * ```
 */
export function getPrNumber(commitMessage: string | undefined): number | undefined {
  if (!commitMessage)
    return undefined

  const firstLine = commitMessage.split('\n')[0].trim()
  /**
   * Match patterns like (#123) or #123 at the end of the first line.
   * This covers most common squash merge formats.
   */
  const match = firstLine.match(/\(#(\d+)\)$|#(\d+)\s*$/)

  if (!match)
    return undefined

  // Return the matched group, handling both capture patterns
  const prNumber = match[1] || match[2]
  return prNumber ? Number.parseInt(prNumber, 10) : undefined
}

/**
 * Get the suffix for the first line of the changelog entry.
 * This includes the PR number if available, otherwise the short commit SHA.
 * If neither is available, returns an empty string.
 */
export function getSuffix(pr: number | undefined, commitSha: string | undefined, options: ValidOptions): string {
  if (pr) {
    return ` ([#${pr}](${getPrUrl(options, pr)}))`
  }
  else if (commitSha) {
    return ` ([\`${getShortSha(commitSha)}\`](${getCommitUrl(options, commitSha)}))`
  }
  else {
    return ''
  }
}
