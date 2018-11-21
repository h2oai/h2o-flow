diecut = require('diecut')
{ isString } = require('lodash')

module.exports =
  template: diecut
  render: (name, html) ->
    el = document.createElement name
    if html
      if isString html
        el.innerHTML = html
      else
        el.appendChild html
    el
