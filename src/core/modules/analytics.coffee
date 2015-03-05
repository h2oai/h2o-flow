Flow.Analytics = (_) ->
  link _.trackEvent, (category, action, label, value) ->
    defer ->
      window.ga 'send', 'event', category, action, label, value

  link _.trackException, (description) ->
    defer ->
      window.ga 'send', 'exception',
        exDescription: description
        exFatal: no
        appName: 'Flow'
        appVersion: Flow.Version
