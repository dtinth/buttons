
var fs = require('fs')
var join = require('path').join
var semver = require('semver')
var _ = require('lodash')

var BASE = join(__dirname, '/buttons')

function Styles(styles) {
  this.styles = styles
}

Styles.prototype.get = function(name) {
  return this.styles[name] || raise('Unable to find style ' + name)
}

function Style(options) {
  _.assign(this, options)
}

Style.prototype.version = function(spec) {
  var list = Object.keys(this.versions)
  var version = semver.maxSatisfying(list, spec) || raise('Unable to find satisfying version ' + spec)
  return this.versions[version] || raise('Unable to get the version object for ' + version)
}

function Version(options) {
  _.assign(this, options)
}

module.exports = readStyles()
print(module.exports)

function readStyles() {
  return new Styles(mapBy('name', fs.readdirSync(BASE)
    .filter(isDirectory)
    .map(createStyle)))
}

function isDirectory(name) {
  return fs.statSync(join(BASE, name)).isDirectory()
}

function createStyle(name) {
  var dir = join(BASE, name)
  var versions = fs.readdirSync(dir).map(createVersion.bind(null, dir, name))
  return new Style({
    name: name,
    versions: mapBy('version', versions),
  })
}

function createVersion(dir, name, file) {
  var versionNumber = parseVersionNumber(file)
  return new Version({
    version: versionNumber,
    path: join(name, file)
  })
}

function parseVersionNumber(filename) {
  var match = filename.match(/(v\d+\.\d+\.\d+.*?)\.svg/)
  if (!match) {
    throw new Error("Cannot parse version from " + filename)
  }
  var version = semver.clean(match[1])
  if (!version) {
    throw new Error("Invalid version " + match[1] + " for " + filename)
  }
  return version
}

function mapBy(name, array) {
  var out = { }
  array.forEach(function(element) {
    out[element[name]] = element
  })
  return out
}

function raise(message) {
  throw new Error(message)
}

function print(styles) {
  console.log('Available styles:')
  for (var style in styles.styles) {
    console.log(' - ' + style + ': ' +
      Object.keys(styles.get(style).versions).join(', '))
  }
}
