# WebPack entry point, just load all necessary files
require('./flow-lib.styl')
require('./flow.styl')
require('./scala-editor.styl')
require('../custom/custom.css')

require('bootstrap/dist/js/bootstrap')
require('../vendor/bootstrap-growl/jquery.bootstrap-growl.js')

require('jquery-textrange/jquery-textrange')

# Start Flow
require('./core/flow')
