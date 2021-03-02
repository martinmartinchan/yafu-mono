const { readFileSync, writeFileSync } = require('fs')
const { deepStrictEqual } = require('assert')

const argv = process.argv.slice(2)
const subpaths = argv.filter((arg) => arg !== '--fix')

const fix = argv.length !== subpaths.length

const expectedPaths = [ '- node_modules', ...subpaths.map((s) => `- modules/${s}/node_modules`) ]

const filePath = `${__dirname}/../.circleci/config.yml`
const content = readFileSync(filePath, 'utf-8')

function matches (regex) {
  return (string) => regex.test(string)
}

function trim (s) {
  return s.trim()
}

const lines = content.split('\n')
const firstLine = lines.findIndex(matches(/#pathsbegin/)) + 1
const lastLine = lines.findIndex(matches(/#pathsend/))

function sendError (s) {
  process.stderr.write(s)
  process.stderr.write('\n')
  process.exit(1)
}

if (firstLine === -1) {
  sendError('Could not find #pathsbegin marker in circle ci config file')
}

if (lastLine === -1) {
  sendError('Could not find #pathsend marker in circle ci config file')
}

function createPadding (n, string = '') {
  return string.length < n
    ? createPadding(n, ` ${string}`)
    : string
}

function fixFile () {
  const firstLineContent = lines[firstLine]
  const paddingSize = firstLineContent.split('').findIndex((c) => c !== ' ')
  const padding = createPadding(paddingSize)
  const paddedLines = expectedPaths.map((p) => `${padding}${p}`)
  const nbrLines = lastLine - firstLine
  lines.splice(firstLine, nbrLines, ...paddedLines)
  writeFileSync(filePath, lines.join('\n'))
}

const actualPaths = lines.slice(firstLine, lastLine).map(trim)

function niceError () {
  const notFound = expectedPaths.filter((p) => actualPaths.indexOf(p) === -1)
  const extra = actualPaths.filter((p) => expectedPaths.indexOf(p) === -1)
  const errorLines = [ 'Cache paths not matching expected paths:' ]
  if (notFound.length > 0) {
    errorLines.push('Expected modules not found:', ...notFound)
  }
  if (extra.length > 0) {
    errorLines.push('Unexpected modules in conf file:', ...extra)
  }
  return errorLines.join('\n')
}

try {
  deepStrictEqual(actualPaths, expectedPaths)
} catch (e) {
  if (fix) {
    fixFile()
  } else {
    sendError(niceError())
  }
}
