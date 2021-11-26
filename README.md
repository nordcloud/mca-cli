# MCA CLI

CLI to help automating MCA work

## Installation

1. Clone repository
2. Run `npm link`

## Local development

- Watch and compile on change `npm run start`
- Compile typescript to javascript with `npm run build`
- Run built mca cli with `./dist/bin/mca.js`

Commits should use [Conventional Commits format](https://www.conventionalcommits.org/) for changelog generation and versioning.

### Folder organization

- src (Contains source files)
    - bin (Starting point for cli app)
    - cmd (Command line configs using yargs commandDir)
    - lib (Code for to commands)
- assets (Assets required for the command line)
- dist (Build folder, same as src but with js files)

## Linting

- Lint code with `npm run lint`
- Fix linter errors with `npm run lint:fix`

## Testing

- Run tests with `npm run test`

Unit tests should be in the same location as the code with added spec.ts
extension. Larger integration tests should be separated to test folder.

## Release

`mca-cli` uses standard-version to make the version bump, add tags and update the CHANGELOG automatically based on conventional commit messages.

Follow these steps to create a new release:

1. Run `git checkout master` to ensure you are on the master branch
1. Run `git pull` to pull the latest changes
1. Run `npm run release` to create tags and update changelog
1. Run `git push --follow-tags origin master` to push the tags
1. Run `npm pack` to create a release package
1. Go go GitHub and draft a new release
1. Select the tag that was just created
1. Upload the mca-cli-[version].tgz file created from `npm pack`
1. Publish the release