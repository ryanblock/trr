#! /usr/bin/env node
let { homedir } = require('os')
let { existsSync, readFileSync } = require('fs')
let { join } = require('path')
let { spawn } = require('child_process')
let watcher = require('node-watch')
let minimist = require('minimist')
let c = require('picocolors')
let update = require('update-notifier-cjs')
let pkg = require(join(__dirname, 'package.json'))

let prefsPath = join(homedir(), '.trr.json')
let prefs = {}
if (existsSync(prefsPath)) prefs = JSON.parse(readFileSync(prefsPath))

// Update
let boxenOpts = { padding: 1, margin: 1, align: 'center', borderColor: 'green', borderStyle: 'round', dimBorder: true }
update({ pkg, shouldNotifyInNpmScript: true }).notify({ boxenOpts })

// Args
let alias = {
  ignore:     [ 'i' ],
  queue:      [ 'q' ],
  runOnStart: [ 'r' ],
  timeout:    [ 't' ],
  watch:      [ 'w' ],
  verbose:    [ 'v' ],
}
let boolean = [ 'queue', 'runOnStart', 'verbose' ]
let opts = minimist(process.argv.slice(2), { alias, boolean })

let { _: run } = opts
let ignore = opts.ignore || prefs.ignore || []
let queue = opts.queue || prefs.queue
let timeout = opts.timeout || prefs.timeout || 5
let watch = opts.watch || prefs.watch || process.cwd()
let verbose = opts.verbose || prefs.verbose || false

if (!run.length) {
  console.error(c.red('Error:'), 'Please supply a command to run')
  process.exit(1)
}

// Set ignore list
ignore = typeof ignore === 'string' ? [ ignore ] : ignore
ignore.unshift('node_modules', '.git')

// Use specified shortcuts in ~/.trr.json
let input
if (prefs.shortcuts && prefs.shortcuts[run[0]]) {
  input = prefs.shortcuts[run[0]]
  if (run.length > 1) run.slice(1).forEach((arg, i) => {
    input = input.replace(`$${i}`, arg)
  })
}
else input = run.join(' ')

// Announce
console.log(c.bold(`Watching:`), watch)
console.log(c.bold(`Will run:`), input)
if (verbose) console.log(c.dim(`Ignoring: ${ignore.join(', ')}`))

// Current status
let running = false
let queued = false

// Start
if (prefs.runOnStart) go()
watcher(watch, { recursive: true }, function (event, filename) {
  filename = filename.replace(watch, '').substr(1)
  if (ignore.some(i => filename.includes(i))) {
    if (!filename.includes('node_modules') && verbose) console.log(c.dim(`Ignored: ${filename}`))
    return
  }

  if (verbose) console.log(`${event.charAt(0).toUpperCase() + event.substr(1)}d: ${filename}`)

  if (!running) go(filename)
  else if (running && queue) queued = true
})

function go (filename) {
  console.log() // Break up the runs a bit
  let start = Date.now()
  let to = timeout * 1000
  let lastPrinted

  running = true
  console.log(c.bold(`Running:`), input)

  let cmd, args
  // The inclusion of pipe shell syntax necessitates running the command as a bash abstraction
  if (input.match(/|/) && !process.platform.startsWith('win')) {
    cmd = '/bin/sh'
    args = [ '-c', `'${input}'` ]
  }
  else {
    let bits = input.split(' ')
    cmd = bits[0]
    args = bits.slice(1)
    args = args.map(a => {
      if (a === '{last}') a = filename
      return a
    })
  }
  let options = {
    cwd: process.cwd(),
    shell: true,
    env: {
      FORCE_COLOR: true,
      ...process.env,
    },
  }
  let result = spawn(cmd, args, options)

  result.stdout.on('data', data => {
    lastPrinted = Date.now()
    process.stdout.write(data.toString())
  })
  result.stderr.on('data', data => {
    lastPrinted = Date.now()
    process.stderr.write(data.toString())
  })
  result.on('error', err => {
    console.log('Spawn error:', err)
    process.exit(1)
  })

  // Begin inactivity checks
  let interval = setInterval(() => {
    let timedOut = (Date.now() - lastPrinted) >= to
    if (running && timedOut) {
      console.log(c.dim(`Terminated run due to inactivity for ${to}ms`))
      result.kill('SIGINT')
    }
  }, 100)

  result.on('close', code => {
    running = false
    clearInterval(interval)

    let good = code === 0
    let status = good ? c.green(c.bold('Success!')) : c.red(c.bold('Failed :('))
    console.log(status)
    console.log(c.dim(`  | '${input}' exited ${good ? '' : 'un'}successfully with code ${code} in ${Date.now() - start}ms`))

    if (queue && queued) {
      console.log(c.dim(`  | Starting queued run`))
      queued = false
      go()
    }
  })
}
