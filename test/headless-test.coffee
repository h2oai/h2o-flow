system = require 'system'

phantom.onError = (message, stacktrace) ->
  if stacktrace?.length
    stack = for t in stacktrace
      ' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (if t.function then ' (in function ' + t.function + ')' else '')
    console.error "ERROR: #{message}\n" + stack.join '\n'
    phantom.exit 1

hostname = system.args[1] ? 'localhost:54321'

page = (require 'webpage').create()

page.onResourceError = ({ url, errorString }) ->
  console.error "ERROR: #{url}: #{errorString}"

page.onConsoleMessage = (message) ->
  console.log message

page.open "http://#{hostname}/flow/index.html", (status) ->
  if status is 'success'
    page.evaluate ->
      for k, v of window.flow.context
        console.log k
      return
    phantom.exit 0
  else
    phantom.exit 1


