# MCA CLI
 THis is a yes
CLI to help automating MCA work

## Installation

1. Clone repository
2. Run `npm link`

## Local development

- Watch and compile on change `npm run start`
- Compile typescript to javascript with `npm run build`
- Run built mca cli with `./dist/bin/mca.js`

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

Run `npm run release` to make version bump, add tags and update CHANGELOG automatically.
