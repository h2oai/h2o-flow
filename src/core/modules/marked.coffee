return unless window?.marked?

marked.setOptions
  smartypants: yes
  highlight: (code, lang) ->
    if window.hljs
      (window.hljs.highlightAuto code, [ lang ]).value
    else
      code

