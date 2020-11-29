#! /usr/bin/env node
let { join } = require('path')
let { spawn } = require('child_process')
let update = require('update-notifier')
let watcher = require('node-watch')
let yargs = require('yargs')
let { hideBin } = require('yargs/helpers')
let chalk = require('chalk')
let pkg = require(join(__dirname, 'package.json'))

// Update
let boxenOpts = { padding: 1, margin: 1, align: 'center', borderColor: 'green', borderStyle: 'round', dimBorder: true }
update({ pkg, shouldNotifyInNpmScript: true }).notify({ boxenOpts })

// Args
let opts = yargs(hideBin(process.argv)).argv
let {
  _: run,
  ignore = [],
  queue = false,
  watch = process.cwd(),
  verbose = false
} = opts
// TODO ↓ remove me! ↓
console.log(`opts:`, opts)
if (!run.length) {
  console.error(chalk.red('Error:'), 'Please supply a command to run')
  process.exit(1)
}
ignore = typeof ignore === 'string' ? [ ignore ] : ignore
ignore.unshift('node_modules')
let name = run.join(' ')

// Announce
console.log(chalk.bold(`Watching:`), watch)
console.log(chalk.bold(`Will run:`), name)
if (verbose) console.log(chalk.dim(`Ignoring: ${ignore.join(', ')}`))

// Current status
let running = false
let queued = false

watcher(watch, { recursive: true }, function (event, filename) {
  filename = filename.replace(watch, '').substr(1)
  if (ignore.some(i => filename.includes(i))) {
    if (!filename.includes('node_modules') && verbose) console.log(chalk.dim(`Ignored: ${filename}`))
    return
  }

  if (verbose) console.log(`${event.charAt(0).toUpperCase() + event.substr(1)}d: ${filename}`)

  function go () {
    running = true
    console.log(chalk.bold(`Running:`), name)

    let cmd = run[0]
    let args = run.slice(1)
    let options = {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    }
    let result = spawn(cmd, args, options)

    result.on('close', code => {
      running = false

      let good = code === 0
      let status = good ? chalk.green.bold('Success!') : chalk.red.bold('Failed :(')
      console.log(status)
      console.log(`  | ${name} exited ${good ? '' : 'un'}successfully with code ${code}`)

      if (queue && queued) {
        console.log(`  | Starting queued run`)
        queued = false
        go()
      }

      console.log() // Break up the runs a bit
    })
  }

  if (!running) go()
  else if (running && queue) queued = true
})
