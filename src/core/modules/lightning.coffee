# TODO hacks for lightning
window.diecut = require('diecut')
window.chroma = require('chroma-js')
window.d3 = require('d3')

util = require './util'
lightning = require '../../../vendor/h2oai/lightning.min'

if lightning.settings
  lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace'
  lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace'

lightning.createDataFrame = lightning.createFrame
lightning.createTempKey = -> 'flow_' + util.uuid().replace /\-/g, ''

module.exports = lightning
