{ map, sortBy } = require('lodash')

{ lift, link, signal, signals } = require("../modules/dataflow")
{ fromNow } = require('../modules/util')

exports.init = (_) ->
  _docs = signals []

  _sortedDocs = lift _docs, (docs) ->
    sortBy docs, (doc) -> -doc.date().getTime()

  _hasDocs = lift _docs, (docs) -> docs.length > 0

  createNotebookView = (notebook) ->
    _name = notebook.name
    _date = signal new Date notebook.timestamp_millis
    _fromNow = lift _date, fromNow

    load = ->
      _.confirm 'This action will replace your active notebook.\nAre you sure you want to continue?', { acceptCaption: 'Load Notebook', declineCaption: 'Cancel' }, (accept) ->
        if accept
          _.load _name

    purge = ->
      _.confirm "Are you sure you want to delete this notebook?\n\"#{_name}\"", { acceptCaption: 'Delete', declineCaption: 'Keep' }, (accept) ->
        if accept
          _.requestDeleteObject 'notebook', _name, (error) ->
            if error
              _alert error.message ? error
            else
              _docs.remove self
              _.growl 'Notebook deleted.'

    self =
      name: _name
      date: _date
      fromNow: _fromNow
      load: load
      purge: purge

  loadNotebooks = ->
    _.requestObjects 'notebook', (error, notebooks) ->
      if error
        console.debug error
      else
        #XXX sort
        _docs map notebooks, (notebook) -> createNotebookView notebook

  link _.ready, ->
    loadNotebooks()

    link _.saved, -> loadNotebooks()
    link _.loaded, -> loadNotebooks()

  docs: _sortedDocs
  hasDocs: _hasDocs
  loadNotebooks: loadNotebooks
