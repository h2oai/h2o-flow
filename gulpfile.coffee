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
desugar = require 'desugar'

clog = through.obj (file, enc, cb) ->
  console.log file.path
  cb()

expand = (yml) ->
  through.obj (file, enc, cb) ->
    if file.isNull()
      cb null, file
      return
    if file.isStream()
      cb new gutil.PluginError 'gulp-desugar', 'Streaming not supported'
      return

    symbols = yaml.safeLoad fs.readFileSync yml, encoding: 'utf8'
    try
      file.contents = new Buffer desugar symbols, file.contents.toString()
      cb null, file
    catch error
      cb new gutil.PluginError 'gulp-desugar', error, fileName: file.path

config =
  dir:
    deploy: process.env.FLOW_DEPLOY_DIR or process.env.npm_config_output or './build'
  lib:
    js: [
      'lib/node-uuid/uuid.js'
      'lib/stacktrace-js/stacktrace.js'
      'lib/jquery/dist/jquery.js'
      'lib/jquery-textrange/jquery-textrange.js'
      'lib/momentjs/min/moment.min.js'
      'lib/mousetrap/mousetrap.js'
      'lib/mousetrap/plugins/global-bind/mousetrap-global-bind.js'
      'lib/lodash/dist/lodash.js'
      'lib/esprima/esprima.js'
      'vendor/escodegen/escodegen.browser.js'
      'lib/coffeescript/extras/coffee-script.js'
      'lib/bootstrap/dist/js/bootstrap.js'
      'vendor/bootstrap-growl/jquery.bootstrap-growl.js'
      'lib/d3/d3.js'
      'lib/chroma-js/chroma.js'
      'lib/marked/lib/marked.js'
      'lib/highlightjs/highlight.pack.js'
      'lib/knockoutjs/dist/knockout.debug.js'
      'lib/typeahead.js/dist/typeahead.jquery.min.js'
      'lib/diecut/diecut.js'
      'vendor/h2oai/lightning.min.js'
      'lib/codemirror/lib/codemirror.js'
      'lib/codemirror/mode/clike/clike.js'
      'lib/codemirror/addon/edit/matchbrackets.js'

    ]
    css: [
      'fonts/lato/fonts.css'
      'fonts/source-code-pro/fonts.css'
      'lib/fontawesome/css/font-awesome.css'
      'lib/highlightjs/styles/tomorrow.css'
      'lib/bootstrap/dist/css/bootstrap.css'
      'lib/codemirror/lib/codemirror.css'
    ]
    cssmap: [
      'lib/bootstrap/dist/css/bootstrap.css.map'
    ]
    fonts: [
      'fonts/lato/fonts/Lato-Regular.*'
      'fonts/lato/fonts/Lato-Italic.*'
      'fonts/lato/fonts/Lato-Bold.*'
      'fonts/lato/fonts/Lato-BoldItalic.*'
      'fonts/source-code-pro/fonts/SourceCodePro-Regular.*'
      'fonts/source-code-pro/fonts/SourceCodePro-It.*'
      'fonts/source-code-pro/fonts/SourceCodePro-Bold.*'
      'fonts/source-code-pro/fonts/SourceCodePro-BoldIt.*'
      'lib/bootstrap/dist/fonts/*.*'
      'lib/fontawesome/fonts/*.*'
    ]
    img: [
      'src/*.png'
    ]
    custom: [
      'custom/*.*'
    ]

gulp.task 'build-tests', ->
  gulp.src [ 'src/**/*.coffee' ]
    .pipe coffee bare: no
    .pipe concat 'flow-tests.js'
    .pipe expand 'desugar.yml'
    .pipe header '"use strict";(function(){ var lodash = require(\'lodash\'); var test = require(\'tape\'); var Flow={}; var H2O={};'
    .pipe footer '}).call(this);'
    .pipe gulp.dest './build/js/'

gulp.task 'build-templates', ->
  gulp.src 'src/index.jade'
    .pipe jade pretty: yes
    .pipe gulp.dest config.dir.deploy

gulp.task 'build-styles', ->
  gulp.src [ 'src/*.styl' ]
    .pipe stylus use: [ nib() ]
    .pipe gulp.dest config.dir.deploy + '/css/'

gulp.task 'build-libs', ->
  gulp.src config.lib.js
    .pipe concat 'flow-lib.js'
    .pipe gulp.dest config.dir.deploy + '/js/'

  gulp.src config.lib.img
    .pipe gulp.dest config.dir.deploy + '/img/'

  gulp.src config.lib.fonts
    .pipe gulp.dest config.dir.deploy + '/fonts/'

  gulp.src config.lib.css
    .pipe concat 'flow-lib.css'
    .pipe gulp.dest config.dir.deploy + '/css/'

  gulp.src config.lib.cssmap
    .pipe gulp.dest config.dir.deploy + '/css/'

  gulp.src config.lib.custom
    .pipe gulp.dest config.dir.deploy + '/custom/'

gulp.task 'watch', ->
  gulp.watch 'src/**/*.jade', [ 'build-templates' ]
  gulp.watch 'src/**/*.styl', [ 'build-styles' ]

gulp.task 'clean', ->
  gulp.src config.dir.deploy, read: no
    .pipe clean()

gulp.task 'build', [ 
  'build-libs'
  'build-templates'
  'build-styles'
]

gulp.task 'default', [ 'build' ]
