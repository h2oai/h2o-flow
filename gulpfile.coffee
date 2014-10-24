fs = require 'fs'
gulp = require 'gulp'
path = require 'path'
through = require 'through2'
clean = require 'gulp-clean'
concat = require 'gulp-concat'
iff = require 'gulp-if'
ignore = require 'gulp-ignore'
order = require 'gulp-order'
header = require 'gulp-header'
footer = require 'gulp-footer'
gutil = require 'gulp-util'
help = require 'gulp-task-listing'
coffee = require 'gulp-coffee'
jade = require 'gulp-jade'
stylus = require 'gulp-stylus'
nib = require 'nib'
yaml = require 'js-yaml'
shorthand = require './tools/shorthand/shorthand.coffee'

clog = through.obj (file, enc, cb) ->
  console.log file.path
  cb()

expand = (yml) ->
  through.obj (file, enc, cb) ->
    if file.isNull()
      cb null, file
      return
    if file.isStream()
      cb new gutil.PluginError 'gulp-shorthand', 'Streaming not supported'
      return

    symbols = yaml.safeLoad fs.readFileSync yml, encoding: 'utf8'
    implicits = [ 'console', 'Math', 'context', 'lodash' ]
    try
      file.contents = new Buffer shorthand symbols, file.contents.toString(), implicits: implicits
      cb null, file
    catch error
      cb new gutil.PluginError 'gulp-shorthand', error, fileName: file.path

config =
  dir:
    deploy: process.env.npm_config_output or './build'
  lib:
    js: [
      'lib/stacktrace-js/stacktrace.js'
      'lib/jquery/dist/jquery.js'
      'lib/jquery-textrange/jquery-textrange.js'
      'lib/mousetrap/mousetrap.js'
      'lib/mousetrap/plugins/global-bind/mousetrap-global-bind.js'
      'lib/lodash/dist/lodash.js'
      'lib/esprima/esprima.js'
      'lib/escodegen/escodegen.browser.js'
      'lib/coffeescript/extras/coffee-script.js'
      'lib/bootstrap/dist/js/bootstrap.js'
      'lib/d3/d3.js'
      'lib/marked/lib/marked.js'
      'lib/knockoutjs/dist/knockout.debug.js'
      'lib/typeahead.js/dist/typeahead.jquery.min.js'
    ]
    css: [
      'lib/fontawesome/css/font-awesome.css'
      'lib/bootstrap/dist/css/bootstrap.css'
    ]
    cssmap: [
      'lib/bootstrap/dist/css/bootstrap.css.map'
    ]
    fonts: [
      'fonts/*.*'
      'lib/bootstrap/dist/fonts/*.*'
      'lib/fontawesome/fonts/*.*'
    ]
    img: [
      'src/images/*.*'
    ]

gulp.task 'build-scripts', ->
  gulp.src [ 'src/scripts/global.hypergraph.coffee', 'src/scripts/flow*.coffee' ]
    .pipe ignore.exclude /tests.coffee$/
    .pipe iff /global\..+\.coffee$/, (coffee bare: yes), (coffee bare: no)
    .pipe order [ 'global.prelude.js', 'global.*.js', '*.js' ]
    .pipe concat 'flow.js'
    .pipe expand 'shorthand.yml'
    .pipe header '"use strict";(function(){ var lodash = window._; window.Flow={};'
    .pipe footer '}).call(this);'
    .pipe gulp.dest config.dir.deploy + '/js/'

gulp.task 'build-tests', ->
  gulp.src 'src/scripts/*.coffee'
    .pipe ignore.exclude /flow.coffee/
    .pipe iff /global\..+\.coffee$/, (coffee bare: yes), (coffee bare: no)
    .pipe order [ 'global.tests.js', 'global.prelude.js', 'global.*.js', '*.js' ]
    .pipe concat 'flow-tests.js'
    .pipe header '"use strict";(function(){'
    .pipe footer '}).call(this);'
    .pipe gulp.dest config.dir.deploy + '/js/'

gulp.task 'build-templates', ->
  gulp.src 'src/templates/*.jade'
    .pipe ignore.include /index.jade$/
    .pipe jade pretty: yes
    .pipe gulp.dest config.dir.deploy

gulp.task 'build-styles', ->
  gulp.src 'src/styles/*.styl'
    .pipe ignore.include /flow.styl$/
    .pipe stylus use: [ nib() ]
    .pipe gulp.dest config.dir.deploy + '/css/'

gulp.task 'build-libs', ->
  gulp.src config.lib.js
    .pipe concat 'lib.js'
    .pipe gulp.dest config.dir.deploy + '/js/'

  gulp.src config.lib.img
    .pipe gulp.dest config.dir.deploy + '/img/'

  gulp.src config.lib.fonts
    .pipe gulp.dest config.dir.deploy + '/fonts/'

  gulp.src config.lib.css
    .pipe concat 'lib.css'
    .pipe gulp.dest config.dir.deploy + '/css/'

  gulp.src config.lib.cssmap
    .pipe gulp.dest config.dir.deploy + '/css/'

gulp.task 'watch', ->
  gulp.watch 'src/scripts/*.coffee', [ 'build-scripts' ]
  gulp.watch 'src/templates/*.jade', [ 'build-templates' ]
  gulp.watch 'src/styles/*.styl', [ 'build-styles' ]

gulp.task 'clean', ->
  gulp.src config.dir.deploy, read: no
    .pipe clean()

gulp.task 'test', [ 'build-tests' ], ->
  require path.resolve config.dir.deploy + '/js/flow-tests.js'

gulp.task 'build', [ 
  'build-libs'
  'build-scripts'
  'build-templates'
  'build-styles'
]

gulp.task 'default', [ 'build' ]
