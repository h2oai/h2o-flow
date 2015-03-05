Flow.Version = '999.999.999'

Flow.About = (_) ->
  _properties = signals []

  link _.ready, ->
    if Flow.BuildProperties
      _properties Flow.BuildProperties
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
          value: Flow.Version

        _properties Flow.BuildProperties = properties

  properties: _properties

