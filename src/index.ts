/**
 * This source code contains code from:
 * - https://github.com/svitejs/changesets-changelog-github-compact (MIT License)
 */

import type { ChangelogFunctions } from '@changesets/types'
import { cleanSummary, getCommitUrl, getPrNumber, getRepository, getShortSha, getSuffix, validate } from './_utils'

const changelogFunctions: ChangelogFunctions = {
  getDependencyReleaseLine: async (changesets, dependenciesUpdated, options) => {
    validate(options)

    if (dependenciesUpdated.length === 0)
      return ''

    /**
     * Link out all the commit SHAs where dependencies were updated
     */
    const changesetLink = `- Updated dependencies [${
      changesets.map((c) => {
        if (c.commit) {
          return `[\`${getShortSha(c.commit)}\`](${getCommitUrl(options, c.commit)})`
        }

        return null
      }).filter(Boolean).join(', ')
    }]:`

    /**
     * List out all the updated dependencies
     */
    const updatedDependenciesList = dependenciesUpdated.map(d => `  - ${d.name}@${d.newVersion}`)

    return [changesetLink, ...updatedDependenciesList].join('\n')
  },
  getReleaseLine: async (changeset, type, options) => {
    validate(options)

    /**
     * This function contains the main functionality of this changelog generator.
     * 1) Discover the local git repository (the repository where the changelog generator is being run)
     * 2) `changeset.summary` is cleaned up and will be used as the text body of the changelog entry
     * 3) The commit SHA is used as a fallback if we can't get the PR number from the commit message
     * 4) Put PR number (or its commit SHA fallback) in parentheses at the end of the first line of the changelog entry
     * 5) Add the rest of the changelog entry in the next lines
     * 6) Return the generated lines
     */

    const repository = getRepository()
    const summary = cleanSummary(changeset.summary)

    let commitMsg: string | undefined

    if (changeset.commit) {
      try {
        const commit = repository.findCommit(changeset.commit)

        if (commit) {
          const commitMessage = commit.message()
          if (commitMessage) {
            // Only get the first line of the commit message
            commitMsg = commitMessage.split('\n')[0].trim()
          }
        }
      }
      catch (error) {
        console.warn(`Failed to get commit message for ${changeset.commit}:`, error)
      }
    }

    const [firstLine, ...restOfLines] = summary.split('\n')
    const suffix = getSuffix(getPrNumber(commitMsg), changeset.commit, options)

    return `\n- ${firstLine}${suffix}\n${restOfLines.map(l => `  ${l}`).join('\n')}`
  },
}

export default changelogFunctions
