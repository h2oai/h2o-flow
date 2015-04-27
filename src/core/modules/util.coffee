describeCount = (count, singular, plural) ->
  plural = singular + 's' unless plural
  switch count
    when 0
      "No #{plural}"
    when 1
      "1 #{singular}"
    else
      "#{count} #{plural}"

fromNow = (date) -> (moment date).fromNow()

formatBytes = (bytes) ->
  sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  return '0 Byte' if bytes is 0
  i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  Math.round(bytes / Math.pow(1024, i), 2) + sizes[i]

padTime = (n) -> "#{if n < 10 then '0' else ''}#{n}"
formatMilliseconds = (s) ->
  ms = s % 1000
  s = (s - ms) / 1000
  secs = s % 60
  s = (s - secs) / 60
  mins = s % 60
  hrs = (s - mins) / 60
  "#{padTime hrs}:#{padTime mins}:#{padTime secs}.#{ms}"

EOL = "\n"
multilineTextToHTML = (text) ->
  join (map (split text, EOL), (str) -> escape str), '<br/>'

sanitizeName = (name) ->
  name.replace(/[^a-z0-9_ \(\)-]/gi, '-').trim()

highlight = (code, lang) ->
  if window.hljs
    (window.hljs.highlightAuto code, [ lang ]).value
  else
    code

Flow.Util =
  describeCount: describeCount
  fromNow: fromNow
  formatBytes: formatBytes
  formatMilliseconds: formatMilliseconds
  multilineTextToHTML: multilineTextToHTML
  uuid: if window?.uuid then window.uuid else null
  sanitizeName: sanitizeName
  highlight: highlight

