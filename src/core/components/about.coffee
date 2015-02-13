FLOW_VERSION = '999.999.999'

Flow.About = (_) ->
  _properties = signals []

  link _.ready, ->
    if Flow.Version
      _properties Flow.Version
    else
      _.requestAbout (error, response) ->
        properties = []

        unless error
          for { name, value } in response.entries
            properties.push
              caption: 'H2O ' + name
              value: value

        properties.push
          caption: 'Flow version'
          value: FLOW_VERSION

        _properties Flow.Version = properties

  properties: _properties

