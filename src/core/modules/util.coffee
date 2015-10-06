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

splitTime = (s) ->
  ms = s % 1000
  s = (s - ms) / 1000
  secs = s % 60
  s = (s - secs) / 60
  mins = s % 60
  hrs = (s - mins) / 60

  [ hrs, mins, secs, ms ]

formatMilliseconds = (s) ->
  [ hrs, mins, secs, ms ] = splitTime s
  "#{padTime hrs}:#{padTime mins}:#{padTime secs}.#{ms}"

format1d0 = (n) ->
  Math.round(n * 10) / 10

formatElapsedTime = (s) ->
  [ hrs, mins, secs, ms ] = splitTime s
  if hrs isnt 0
    "#{format1d0 (hrs * 60 + mins)/60}h"
  else if mins isnt 0
    "#{format1d0 (mins * 60 + secs)/60}m"
  else if secs isnt 0
    "#{format1d0 (secs * 1000 + ms)/1000}s"
  else
    "#{ms}ms"

formatClockTime = (date) ->
  (moment date).format 'h:mm:ss a'

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
  formatElapsedTime: formatElapsedTime
  formatClockTime: formatClockTime
  multilineTextToHTML: multilineTextToHTML
  uuid: if window?.uuid then window.uuid else null
  sanitizeName: sanitizeName
  highlight: highlight

