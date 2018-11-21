{ defer } = require('lodash')

module.exports = (_, _go, _cancellation) ->

  defer _go

  template: 'flow-cancel-job-output' 
