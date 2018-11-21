module.exports = (_) ->
  render = (input, output) ->
    output.data
      text: input
      template: 'flow-raw'
    output.end()
  render.isCode = no
  render
