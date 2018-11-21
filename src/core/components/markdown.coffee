marked = require('../modules/marked')

module.exports = (_) ->
  render = (input, output) ->
    try
      output.data
        html: marked input.trim() or '(No content)'
        template: 'flow-html'
    catch error
      output.error error
    finally
      output.end()
  render.isCode = no
  render

