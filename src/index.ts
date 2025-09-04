import type { ChangelogFunctions } from '@changesets/types'

const changelogFunctions: ChangelogFunctions = {
  getDependencyReleaseLine: async (changesets, dependenciesUpdated, options) => {
    // console.log(`changesets: ${JSON.stringify(changesets, null, 2)}`)
    // console.log(`dependenciesUpdated: ${JSON.stringify(dependenciesUpdated, null, 2)}`)

    return 'get-dependency-release-line'
  },
  getReleaseLine: async (changeset, type, options) => {
    // console.log(`changeset: ${JSON.stringify(changeset, null, 2)}`)
    // console.log(`type: ${JSON.stringify(type, null, 2)}`)

    return 'get-release-line'
  },
}

export default changelogFunctions
