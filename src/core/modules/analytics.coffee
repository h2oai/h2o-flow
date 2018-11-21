{ defer } = require('lodash')

module.exports = (_) ->
  link _.trackEvent, (category, action, label, value) ->
    defer ->
      window.ga 'send', 'event', category, action, label, value

  link _.trackException, (description) ->
    defer ->
      _.requestEcho "FLOW: #{description}", ->

      window.ga 'send', 'exception',
        exDescription: description
        exFatal: no
        appName: 'Flow'
        appVersion: _.Version
