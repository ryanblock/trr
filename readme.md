# trr
## A convenient automated test re-runner

Who wants to save a change to a module or a test, then swap back to your terminal and manually invoke a test run? Ew.

Iterate faster by letting your tests automatically re-run themselves whenever you make changes to your local project.

Kind of like `jest --watch`, except for any test harness, script, or command.


### Install

`npm i -g trr`


### Usage

trr is a CLI aid to your existing tests and scripts, automatically re-running a given command when a (qualifying) file changes in your project.

While your tests are running, filesystem changes will be ignored until the current run is complete, meaning your tests can include filesystem mutations without recursively calling itself.

For example: say you normally run your tests with `npm test`. From your project directory, just run: `trr npm test` to start the watcher.


#### Flags

- `--ignore` - list of strings to ignore matches; always includes `node_modules`
- `--queue` - (default: disabled) - queue up the next run if a matching filesystem change occurs during the current run; can only queue up one run at a time
- `--watch` - directory (default: current directory) - select a specific directory to watch
- `--verbose` - (default: disabled) - enable verbose logging


#### Use it for more than just tests

While trr was designed to re-run test suites, it will accept and run any command. Use it to automatically lint your codebase, run spellchecks on docs, or anything else you'd like to run on repeat while you're working on your project.


#### Examples

- Watch only your `tests/` dir:
  - `trr npm test --watch tests`
- Don't re-run tests when you change `tests/` dir:
  - `trr npm test --ignore tests`
- Allow changes to queue up your next test run while the current run is still going:
  - `trr npm test --queue`
- Continually lint your `src/` dir:
  - `trr npm run lint --watch src`
- Spellcheck your docs:
  - `trr ./spellcheck --watch docs`
- Chain together multiple commands (using quotes)
  - `trr 'npm run lint && ./spellcheck'`
