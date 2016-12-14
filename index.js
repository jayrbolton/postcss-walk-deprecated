const R = require('ramda')
const fs = require('fs')
const postcss = require('postcss')
const chalk = require('chalk')


let log = ()=>{}

// options.plugins is an array of postcss plugin modules
// options.input is the top-level directory of containing all input css files
// options.output is the top-level directory that will contain all output/compiled css files
const initialize = options => {
  // Set defaults
  options = R.merge({ copyAssets: [] , indexName: 'index.css' , plugins: [] , input: '' , output: '' }, options)
  // Log is a no-op unless options.log is true
  if(options.log) log = console.log.bind(console)
  return walkDir(options.input, options)
}

// Recursively walk through a directory, finding all index css files or assets
// Uses a stack, not actual recursion
const walkDir = (input, options) => {
  const inputRegex = new RegExp("^" + options.input.replace('/', '\/'))
  let stack = [input]
  let result = {indexFiles: [], directories: [], assetFiles: []}
  // Tree traversal of directory structure using stack recursion
  while(stack.length) {
    input = stack.pop()
    const stats = fs.lstatSync(input)
    const output = R.replace(inputRegex, options.output, input)
    if(stats.isDirectory()) {
      // Push all children in the directory to the stack
      const children = R.map(R.concat(input + '/'), fs.readdirSync(input))
      stack.push.apply(stack, children)
      result.directories.push(input)
    } else if(stats.isFile()) {
      if(input.match(new RegExp('\/' + options.indexName + '$'))) {
        createDirs(output)
        compile(options.plugins, input, output)
        result.indexFiles.push(input)
      } else {
        // Find any asset extension matches
        const ext = input.split('.').pop()
        if(R.contains(ext, options.copyAssets)) {
          copyAsset(input, output)
          result.assetFiles.push(input)
        }
      }
    }
  }
  return result
}

// copy a file over to an output dir
const copyAsset = (input, output) => {
  createDirs(output)
  log(chalk.blue('>>      copying: ' + input + ' to ' + output))
  let rd = fs.createReadStream(input)
  rd.on('error', err => log('!! read error: ' + input + " - " + err))
  let wr = fs.createWriteStream(output)
  wr.on('error', err => log(chalk.red('!! write error: ' + input + ' - ' + err)))
  rd.pipe(wr)
}

const fileExists = path => {
  try {
    fs.accessSync(path)
    return true
  } catch(e) {
    return false
  }
}

// Create the full directory tree for a file path
const createDirs =
  R.compose(
    R.map(dir => fs.mkdirSync(dir)) // create all missing directories
  , R.filter(dir => !fs.existsSync(dir)) // filter out only dirs that do not exist
  , R.dropLast(1) // we don't want the path with the filename at the end (last element in the scan)
  , R.drop(1) // we don't want the first empty array from the scan
  , R.map(R.join('/')) // Array of directory levels ['', 'css', 'css/nonprofits', 'css/nonprofits/recurring_donations.css']
  , R.scan((arr, p) => R.append(p, arr), []) // an array of arrays of directory levels [[], ['css'], ['css', 'nonprofits'], ['css', 'nonprofits', 'recurring_donations.css']]
  , R.split('/')
  )

const logCompileErr = err => 
  process.stderr.write(chalk.red('!!        error: ' + err.message + '\n'))

// Postcss compile an input file to an output path using a postcss compiler object
const compile = (plugins, from, to) => {
  postcss(plugins)
    .process(fs.readFileSync(from), {from, to})
    .then(result => {
      fs.writeFileSync(to, result.css)
      if(result.map) fs.writeFileSync(to + '.map', result.map)
      log(chalk.green.bold('=>     compiled: ' + from + ' to ' + to))
      result.warnings().forEach(warn => log(chalk.red('!!      warning: ' + warn.toString())))
    })
    .catch(logCompileErr)
}

module.exports = initialize
