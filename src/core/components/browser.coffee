Flow.Browser = (_) ->
  _docs = signals []

  _sortedDocs = lift _docs, (docs) ->
    sortBy docs, (doc) -> -doc.date().getTime()

  _hasDocs = lift _docs, (docs) -> docs.length > 0

  createDocView = ([ type, id, doc ]) ->
    _title = signal doc.title
    _date = signal new Date doc.modifiedDate
    _fromNow = lift _date, Flow.Util.fromNow

    load = ->
      _.confirm 'Are you sure you want to load this notebook?', { acceptCaption: 'Load Notebook', declineCaption: 'Cancel' }, (response) ->
        if response
          _.loadNotebook id, doc

    purge = ->
      _.requestDeleteObject type, id, (error) ->
        if error
          debug error
        else
          _docs.remove self

    self =
      id: id
      title: _title
      doc: doc
      date: _date
      fromNow: _fromNow
      load: load
      purge: purge

  storeNotebook = (id, doc, go) ->
    if id
      _.requestPutObject 'notebook', id, doc, (error) ->
        if error
          go error
        else
          for source, index in _docs() when source.id is id
            break
          _docs.splice index, 1, createDocView [ 'notebook', id, doc ]
          go null, id
    else
      id = Flow.Util.uuid()
      _.requestPutObject 'notebook', id, doc, (error) ->
        if error
          go error
        else
          _docs.push createDocView [ 'notebook', id, doc ]
          go null, id

  loadNotebooks = ->
    _.requestObjects 'notebook', (error, objs) ->
      if error
        debug error
      else
        #XXX sort
        _docs map objs, createDocView

  link _.ready, ->
    loadNotebooks()

  link _.storeNotebook, storeNotebook

  docs: _sortedDocs
  hasDocs: _hasDocs
  loadNotebooks: loadNotebooks
