extension = '.flow'

validateFileExtension = (filename) ->
  -1 isnt filename.indexOf extension, filename.length - extension.length

getFileBaseName = (filename) ->
  Flow.Util.sanitizeName filename.substr 0, filename.length - extension.length

H2O.Util =
  validateFileExtension: validateFileExtension
  getFileBaseName: getFileBaseName

