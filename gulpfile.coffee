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
    polymer: [
      'lib/polymer/*.*'
    ]
    "paper-button": [
      'lib/paper-button/*.*'
    ]
    "paper-card": [
      'lib/paper-card/*.*'
    ]
    "paper-dialog": [
      'lib/paper-dialog/*.*'
    ]
    "paper-dialog-scrollable": [
      'lib/paper-dialog-scrollable/*.*'
    ]
    "neon-animation": [
      'lib/neon-animation/*.*'
    ]
    "neon-animation/animations": [
      'lib/neon-animation/animations/*.*'
    ]
    "iron-icon" : [
      'lib/iron-icon/*.*'
    ]
    "iron-icons" : [
      'lib/iron-icons/*.*'
    ]
    "iron-iconset-svg" : [
      'lib/iron-iconset-svg/*.*'
    ]
    "paper-collapse-item" : [
      'lib/paper-collapse-item/*.*'
    ]
    "paper-behaviors" : [
      'lib/paper-behaviors/*.*'
    ]
    "iron-flex-layout" : [
      'lib/iron-flex-layout/*.*'
    ]
    "paper-dialog-behavior" : [
      'lib/paper-dialog-behavior/*.*'
    ]
    "paper-material-shared-styles" : [
      'lib/paper-material-shared-styles/*.*'
    ]
    "neon-animation-runner-behavior" : [
      'lib/paper-animation-runner-behavior/*.*'
    ]
    "iron-collapse" : [
      'lib/iron-collapse/*.*'
    ]
    "paper-styles" : [
      'lib/paper-styles/*.*'
    ]
    "paper-item-body" : [
      'lib/paper-item-body/*.*'
    ]
    "paper-icon-button" : [
      'lib/paper-icon-button/*.*'
    ]
    "icon-image" : [
      'lib/icon-image/*.*'
    ]
    "paper-material" : [
      'lib/paper-material/*.*'
    ]
    "paper-item" : [
      'lib/paper-item/*.*'
    ]
    "iron-image" : [
      'lib/iron-image/*.*'
    ]
    "iron-behaviors" : [
      'lib/iron-behaviors/*.*'
    ]
    "paper-ripple" : [
      'lib/paper-ripple/*.*'
    ]
    "iron-a11y-keys-behavior" : [
      'lib/iron-a11y-keys-behavior/*.*'
    ]
    "iron-flex-layout" : [
      'lib/iron-flex-layout/*.*'
    ]
    "iron-overlay-behavior" : [
      'lib/iron-overlay-behavior/*.*'
    ]
    "iron-resizable-behavior" : [
      'lib/iron-resizable-behavior/*.*'
    ]
    "iron-fit-behavior.html" : [
      'lib/iron-fit-behavior.html/*.*'
    ]
    "iron-meta.html" : [
      'lib/iron-meta.html/*.*'
    ]
    "web-animations-js" : [
      'lib/web-animations-js/*.*'
    ]
    "iron-flex-layout" : [
      'lib/iron-flex-layout/*.*'
    ]
    "iron-flex-layout/classes" : [
      'lib/iron-flex-layout/classes/*.*'
    ]
    "iron-fit-behavior" : [
      'lib/iron-fit-behavior/*.*'
    ]
    "iron-meta" : [
      'lib/iron-meta/*.*'
    ]
    "web-animations-js" : [
      'lib/web-animations-js/*.*'
    ]
    "iron-fit-behavior" : [
      'lib/iron-fit-behavior/*.*'
    ]

gulp.task 'build-scripts', ->
  gulp.src [ 'src/**/*.coffee' ]
    .pipe ignore.exclude /tests.coffee$/
    .pipe coffee bare: no
    .pipe concat 'flow.js'
    .pipe expand 'desugar.yml'
    .pipe header '"use strict";(function(){ var lodash = window._; window.Flow={}; window.H2O={};'
    .pipe footer '}).call(this);'
    .pipe gulp.dest config.dir.deploy + '/js/'

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

  gulp.src config.lib.polymer
    .pipe gulp.dest config.dir.deploy + '/polymer'

  gulp.src config.lib["paper-button"]
    .pipe gulp.dest config.dir.deploy + '/paper-button'

  gulp.src config.lib["paper-card"]
    .pipe gulp.dest config.dir.deploy + '/paper-card'

  gulp.src config.lib["paper-dialog"]
    .pipe gulp.dest config.dir.deploy + '/paper-dialog'

  gulp.src config.lib["paper-dialog-scrollable"]
    .pipe gulp.dest config.dir.deploy + '/paper-dialog-scrollable'

  gulp.src config.lib["iron-icons"]
    .pipe gulp.dest config.dir.deploy + '/iron-icons'

  gulp.src config.lib["iron-iconset-svg"]
    .pipe gulp.dest config.dir.deploy + '/iron-iconset-svg'

  gulp.src config.lib["iron-icon"]
    .pipe gulp.dest config.dir.deploy + '/iron-icon'

  gulp.src config.lib["paper-collapse-item"]
    .pipe gulp.dest config.dir.deploy + '/paper-collapse-item'

  gulp.src config.lib["paper-behaviors"]
    .pipe gulp.dest config.dir.deploy + '/paper-behaviors'

  gulp.src config.lib["iron-flex-layout"]
    .pipe gulp.dest config.dir.deploy + '/iron-flex-layout'

  gulp.src config.lib["iron-flex-layout/classes"]
    .pipe gulp.dest config.dir.deploy + '/iron-flex-layout/classes'

  gulp.src config.lib["paper-dialog-behavior"]
    .pipe gulp.dest config.dir.deploy + '/paper-dialog-behavior'

  gulp.src config.lib["paper-material-shared-styles"]
    .pipe gulp.dest config.dir.deploy + '/paper-material-shared-styles'

  gulp.src config.lib["neon-animation-runner-behavior"]
    .pipe gulp.dest config.dir.deploy + '/paper-animation-runner-behavior'

  gulp.src config.lib["neon-animation"]
    .pipe gulp.dest config.dir.deploy + '/neon-animation'

  gulp.src config.lib["neon-animation/animations"]
    .pipe gulp.dest config.dir.deploy + '/neon-animation/animations'

  gulp.src config.lib["iron-collapse"]
    .pipe gulp.dest config.dir.deploy + '/iron-collapse'

  gulp.src config.lib["paper-styles"]
    .pipe gulp.dest config.dir.deploy + '/paper-styles'

  gulp.src config.lib["paper-item-body"]
    .pipe gulp.dest config.dir.deploy + '/paper-item-body'

  gulp.src config.lib["paper-icon-button"]
    .pipe gulp.dest config.dir.deploy + '/paper-icon-button'

  gulp.src config.lib["icon-image"]
    .pipe gulp.dest config.dir.deploy + '/icon-image'

  gulp.src config.lib["paper-material"]
    .pipe gulp.dest config.dir.deploy + '/paper-material'

  gulp.src config.lib["paper-item"]
    .pipe gulp.dest config.dir.deploy + '/paper-item'

  gulp.src config.lib["iron-image"]
    .pipe gulp.dest config.dir.deploy + '/iron-image'

  gulp.src config.lib["iron-behaviors"]
    .pipe gulp.dest config.dir.deploy + '/iron-behaviors'

  gulp.src config.lib["paper-ripple"]
    .pipe gulp.dest config.dir.deploy + '/paper-ripple'

  gulp.src config.lib["iron-a11y-keys-behavior"]
    .pipe gulp.dest config.dir.deploy + '/iron-a11y-keys-behavior'

  gulp.src config.lib["iron-flex-layout"]
    .pipe gulp.dest config.dir.deploy + '/iron-flex-layout'

  gulp.src config.lib["iron-overlay-behavior"]
    .pipe gulp.dest config.dir.deploy + '/iron-overlay-behavior'

  gulp.src config.lib["iron-resizable-behavior"]
    .pipe gulp.dest config.dir.deploy + '/iron-resizable-behavior'

  gulp.src config.lib["iron-flex-layout/classes"]
    .pipe gulp.dest config.dir.deploy + '/iron-flex-layout/classes'

  gulp.src config.lib["iron-fit-behavior"]
    .pipe gulp.dest config.dir.deploy + '/iron-fit-behavior'

  gulp.src config.lib["iron-meta"]
    .pipe gulp.dest config.dir.deploy + '/iron-meta'

  gulp.src config.lib["web-animations-js"]
    .pipe gulp.dest config.dir.deploy + '/web-animations-js'

  gulp.src config.lib["iron-fit-behavior"]
    .pipe gulp.dest config.dir.deploy + '/iron-fit-behavior'

gulp.task 'watch', ->
  gulp.watch 'src/**/*.coffee', [ 'build-scripts' ]
  gulp.watch 'src/**/*.jade', [ 'build-templates' ]
  gulp.watch 'src/**/*.styl', [ 'build-styles' ]

gulp.task 'clean', ->
  gulp.src config.dir.deploy, read: no
    .pipe clean()

gulp.task 'build', [ 
  'build-libs'
  'build-scripts'
  'build-templates'
  'build-styles'
]

gulp.task 'default', [ 'build' ]
