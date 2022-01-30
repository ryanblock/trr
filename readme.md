# `trr`
## A convenient automated test re-runner

Who wants to save a change to a module or a test, then swap back to your terminal and manually invoke a test run? Ew.

Iterate faster by letting your tests automatically re-run themselves whenever you make changes to your local project.

Kind of like `jest --watch`, except for any test harness, script, or command.


### Install

`npm i -g trr`


### Usage

`trr` is a CLI aid to your existing tests and scripts, automatically re-running a given command when a (qualifying) file changes in your project.

While your tests are running, filesystem changes will be ignored until the current run is complete, meaning your tests can include filesystem mutations without recursively calling itself.

For example: say you normally run your tests with `npm test`. From your project directory, just run: `trr npm test` to start the watcher. Whenever a file changes, `npm test` will re-run and print the result.


#### Preferences + CLI flags

The following preferences are available by creating a `~/.trr.json` file with the following optional properties:

- `ignore` - (array of strings) ignore each match; `trr` includes `node_modules` + `.git` by default
  - Ignore uses a simple string match, so ignoring `foo` will ignore `some/foolish/project`
  - To ignore multiple things, use the tag multiple times; example: `--ignore stuff --ignore
- `runOnStart` (bool, default: false) run the specified script immediately upon starting instead of waiting for a watcher event
- `shortcuts` - **experimental!** (object) - add shortcut scripts with variable replacement based on positional CLI args
  - Example: add `"shortcuts": { "run": "echo $0 $1" }`, then `trr run hello world` will print `hello world` to stdout on every file change
  - On *nix systems, you can also include pipes; for example, execute a single TAP-compatible Node test and pipe to a reporter like so: `"shortcuts": { "node $0 | tap-spec" }`
- `watch` - (string, default: current directory) - specify a (sub)directory to watch
- `verbose` - (bool, default: false) enable verbose logging

The following CLI flags are also available:

- `--ignore`, `-i` - ignore each match; `trr` includes `node_modules` + `.git` by default
  - Ignore uses a simple string match, so ignoring `foo` will ignore `some/foolish/project`
  - To ignore multiple things, use the tag multiple times; example: `--ignore stuff --ignore more-stuff`
- `--queue`, `-q` - (default: disabled) queue up the next run if a matching filesystem change occurs during the current run; can only enqueue one run at a time
- `--runOnStart`, `-r` - (default: false) run the script immediately upon starting instead of waiting for a watcher event
- `--watch`, `-w` - (default: current directory) - specify a (sub)directory to watch
- `--verbose`, `-v` - (default: disabled) enable verbose logging

> Note: Where a setting conflicts, the CLI arg will have priority over the preferences file.


#### Use it for more than just tests

While `trr` was designed to re-run test suites, it will accept and run any command. Use it to automatically lint your codebase, run spellchecks on docs, or anything else you'd like to run on repeat while you're working on your project.


#### Examples

- Iterate on a specific unit test:
  - `trr node test/my-test.js`
- Run all tests, while watching only your `tests/` dir:
  - `trr npm test --watch tests`
- Don't re-run tests when you change your `tests/` dir:
  - `trr npm test --ignore tests`
- Allow changes to queue up your next run while the current run is still going:
  - `trr npm test --queue`
- Continually lint your `src/` dir:
  - `trr npm run lint --watch src`
- Spellcheck your docs:
  - `trr ./spellcheck --watch docs`
- Chain together multiple commands (using quotes)
  - `trr 'npm run lint && ./spellcheck'`
