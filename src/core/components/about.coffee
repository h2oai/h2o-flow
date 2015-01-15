FLOW_VERSION = '0.2.25'

Flow.About = (_) ->
  _properties = signals []

  link _.ready, ->
    _.requestAbout (error, response) ->

      unless error
        for { name, value } in response.entries
          _properties.push
            caption: 'H2O ' + name
            value: value

      _properties.push
        caption: 'Flow version'
        value: FLOW_VERSION

  properties: _properties

