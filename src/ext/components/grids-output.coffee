{ defer, map } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _grids) ->
  _gridViews = signal []

  createGridView = (grid) ->
    view = ->
      _.insertAndExecuteCell 'cs', "getGrid #{stringify grid.grid_id.name}"

    key: grid.grid_id.name
    size: grid.model_ids.length
    view: view

  buildModel = ->
    _.insertAndExecuteCell 'cs', 'buildModel'

  initialize = (grids) ->
    _gridViews map grids, createGridView
    defer _go

  initialize _grids

  gridViews: _gridViews
  hasGrids: _grids.length > 0
  buildModel: buildModel
  template: 'flow-grids-output'


