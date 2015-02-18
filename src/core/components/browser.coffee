Flow.Browser = (_) ->
  _docs = signals []

  _sortedDocs = lift _docs, (docs) ->
    sortBy docs, (doc) -> -doc.date().getTime()

  _hasDocs = lift _docs, (docs) -> docs.length > 0

  createDocView = ([ type, name, doc ]) ->
    _title = signal doc.title
    _date = signal new Date doc.modifiedDate
    _fromNow = lift _date, Flow.Util.fromNow

    load = ->
      _.confirm 'Are you sure you want to load this notebook?', { acceptCaption: 'Load Notebook', declineCaption: 'Cancel' }, (response) ->
        if response
          _.loadNotebook name, doc

    purge = ->
      _.requestDeleteObject type, name, (error) ->
        if error
          debug error
        else
          _docs.remove self

    self =
      name: name
      title: _title
      doc: doc
      date: _date
      fromNow: _fromNow
      load: load
      purge: purge

  storeNotebook = (name, doc, go) ->
    if name
      _.requestPutObject 'notebook', name, doc, (error, name) ->
        if error
          go error
        else
          for source, index in _docs() when source.name is name
            break
          _docs.splice index, 1, createDocView [ 'notebook', name, doc ]
          go null, name
    else
      _.requestPutObject 'notebook', undefined, doc, (error, name) ->
        if error
          go error
        else
          _docs.push createDocView [ 'notebook', name, doc ]
          go null, name

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
