{ link, signal, signals } = require("../modules/dataflow")

exports.init = (_) ->
  _.Version = '999.999.999' # TODO replace with component version
  _properties = signals []

  link _.ready, ->
    if _.BuildProperties
      _properties _.BuildProperties
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
          value: _.Version

        _properties _.BuildProperties = properties

  properties: _properties

