var express = require("express")
var harp = require("harp")
var app = express()
var terraform = require('terraform')

var planet = terraform.root(__dirname + "/buttons")

var when = require('when')
var lift = require('when/node').lift
var render = lift(planet.render.bind(planet))

var styles = require('./styles')

app.use(harp.mount(__dirname + "/public"))
app.get('/button/:template.svg', handle)
app.get('/button/:template/:version.svg', handle)
app.listen(+process.env.PORT || 9000)

function handle(req, res, next) {
  var template = req.param('template', '')
  var version  = req.param('version',  '*')
  when()
  .then(function() {
    if (!template.match(/^[a-z0-9]+$/)) throw new Error("Invalid template name")
  })
  .then(function() {
    return styles.get(template).version(version).path
  })
  .then(function(path) {
    return when()
    .then(function() {
      return makeLocals(req)
    })
    .then(function(locals) {
      return render(path, locals)
    })
  })
  .then(function(result) {
    res.set('Content-Type', 'image/svg+xml')
    res.end(result)
  })
  .catch(function(error) {
    next(error)
  })
  .done()
}

function makeLocals(req) {
  var locals = { params: req.query }
  locals.width = +req.param('width') || 720
  locals.height = +req.param('height') || 0
  locals.param = function(name, defaultValue) {
    return String(req.param(name, defaultValue || '{{' + name + '}}'))
  }
  return locals
}
