marked = require('marked')
highlightjs = require('highlightjs')

marked.setOptions
  smartypants: yes
  highlight: (code, lang) ->
    (highlightjs.highlightAuto code, [ lang ]).value

module.exports = marked
