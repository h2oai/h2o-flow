Flow.Browser = (_) ->
  _docs = signals []

  _sortedDocs = lift _docs, (docs) ->
    sortBy docs, (doc) -> -doc.date().getTime()

  _hasDocs = lift _docs, (docs) -> docs.length > 0

  createNotebookView = (notebook) ->
    _name = notebook.name
    _date = signal new Date notebook.timestamp_millis
    _fromNow = lift _date, Flow.Util.fromNow

    load = ->
      _.confirm 'This action will replace your active notebook.\nAre you sure you want to continue?', { acceptCaption: 'Load Notebook', declineCaption: 'Cancel' }, (accept) ->
        if accept
          _.load _name

    purge = ->
      _.requestDeleteObject 'notebook', _name, (error) ->
        if error
          debug error
        else
          _docs.remove self

    self =
      name: _name
      date: _date
      fromNow: _fromNow
      load: load
      purge: purge

  loadNotebooks = ->
    _.requestObjects 'notebook', (error, notebooks) ->
      if error
        debug error
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
