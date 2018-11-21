module.exports = (_, level) ->
  render = (input, output) ->
    output.data
      text: input.trim() or '(Untitled)'
      template: "flow-#{level}"
    output.end()
  render.isCode = no
  render
