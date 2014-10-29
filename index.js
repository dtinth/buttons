var express = require("express")
var harp = require("harp")
var app = express()
var terraform = require('terraform')

var planet = terraform.root(__dirname + "/buttons")

var when = require('when')
var lift = require('when/node').lift
var render = lift(planet.render.bind(planet))

app.use(harp.mount(__dirname + "/public"))
app.get('/button/:template.svg', handle)
app.listen(+process.env.PORT || 9000)

function handle(req, res, next) {
  var template = req.param('template', '')
  if (template.match(/^[a-z0-9]+$/)) {
    var locals = { params: req.query }
    locals.width = +req.param('width') || 720
    locals.height = +req.param('height') || 0
    locals.param = function(name, defaultValue) {
      return String(req.param(name, defaultValue || '{{' + name + '}}'))
    }
    render(template + '/' + template + '-v1.0.0.svg.ejs', locals)
      .then(function(result) {
        res.set('Content-Type', 'image/svg+xml')
        res.end(result)
      })
      .catch(function(error) {
        next(error)
      })
      .done()
  } else {
    next(new Error('Invalid Template! Sorry :('))
  }
}
