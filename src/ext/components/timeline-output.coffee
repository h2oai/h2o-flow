{ defer, tail, head, delay } = require('lodash')

{ act, react, lift, link, signal, signals } = require("../../core/modules/dataflow")

html = require('../../core/modules/html')
failure = require('../../core/components/failure')
FlowError = require('../../core/modules/flow-error')

module.exports = (_, _go, _timeline) ->
  _isLive = signal no
  _isBusy = signal no

  _headers = [
    'HH:MM:SS:MS'
    'nanosec'
    'Who'
    'I/O Type'
    'Event'
    'Type'
    'Bytes'
  ]

  _data = signal null
  _timestamp = signal Date.now()

  createEvent = (event) ->
    switch event.type
      when 'io'
        [
          event.date
          event.nanos
          event.node
          event.io_flavor or '-'
          'I/O'
          '-'
          event.data
        ]

      when 'heartbeat'
        [
          event.date
          event.nanos
          'many &#8594;  many'
          'UDP'
          event.type
          '-'
          "#{event.sends} sent #{event.recvs} received"
        ]

      when 'network_msg'
        [
          event.date
          event.nanos
          "#{event.from} &#8594; #{event.to}"
          event.protocol
          event.msg_type
          if event.is_send then 'send' else 'receive'
          event.data
        ]

  updateTimeline = (timeline) ->
    [ grid, table, thead, tbody, tr, th, td ] = html.template '.grid', 'table', 'thead', 'tbody', 'tr', 'th', 'td'

    ths = (th header for header in _headers)

    trs = for event in timeline.events
      tr (td cell for cell in createEvent event)

    _data html.render 'div',
      grid [
        table [
          thead tr ths
          tbody trs
        ]
      ]

  toggleRefresh = ->
    _isLive not _isLive()

  refresh = ->
    _isBusy yes
    _.requestTimeline (error, timeline) ->
      _isBusy no
      if error
        _exception failure() _, new FlowError 'Error fetching timeline', error
        _isLive no
      else
        updateTimeline timeline
        delay refresh, 2000 if _isLive()

  act _isLive, (isLive) ->
    refresh() if isLive

  updateTimeline _timeline 

  defer _go

  data: _data
  isLive: _isLive
  isBusy: _isBusy
  toggleRefresh: toggleRefresh
  refresh: refresh
  template: 'flow-timeline-output'

