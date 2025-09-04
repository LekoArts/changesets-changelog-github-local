export const changesets = [
  {
    releases: [
      {
        name: '@lekoarts/foo',
        type: 'patch',
      },
      {
        name: '@lekoarts/bar',
        type: 'patch',
      },
    ],
    summary: 'Summary for this changeset',
    id: 'loose-bears-begin',
    commit: '45e4d391a2a09fc70c48e4d60f505586ada1ba0e',
  },
  {
    releases: [
      {
        name: '@lekoarts/foo',
        type: 'patch',
      },
    ],
    summary: 'Another summary for this changeset',
    id: 'smooth-spies-tie',
    commit: '7f3b8da6dd21c35d3672e44b4f5dd3502b8f8f92',
  },
]

export const dependenciesUpdated = [
  {
    name: '@lekoarts/foo',
    type: 'patch',
    oldVersion: '0.15.3-alpha.5',
    changesets: [
      'loose-bears-begin',
      'smooth-spies-tie',
    ],
    newVersion: '0.15.3-alpha.6',
    packageJson: {
      name: '@lekoarts/foo',
      version: '0.15.3-alpha.5',
    },
    dir: '/Users/lejoe/code/work/mastra/packages/core',
  },
  {
    name: '@lekoarts/bar',
    type: 'patch',
    oldVersion: '0.15.3-alpha.5',
    changesets: [
      'loose-bears-begin',
    ],
    newVersion: '0.15.3-alpha.6',
    packageJson: {
      name: '@lekoarts/bar',
      version: '0.15.3-alpha.5',
    },
    dir: '/Users/lejoe/code/work/mastra/packages/deployer',
  },
]
