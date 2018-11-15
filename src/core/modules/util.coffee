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

#TODO copied over from routines.coffee. replace post h2o.js integration.
format4f = (number) ->
  if number
    if number is 'NaN'
      undefined
    else
      number.toFixed(4).replace(/\.0+$/, '.0')
  else
    number

calcRecall = (cm, index, firstInvalidIndex) ->
    tp = cm.data[index][index]
    fn = 0
    for column, i in cm.data
        if i >= firstInvalidIndex
            break
        if i != index # if not on diagonal
            fn += column[index]
    result = tp / (tp + fn)
    return parseFloat(result).toFixed(2).replace(/\.0+$/, '.0')

calcPrecision = (cm, index, firstInvalidIndex) ->
    tp = cm.data[index][index]
    fp = 0
    for value, i in cm.data[index]
        if i >= firstInvalidIndex # do not count Error, Rate and Recall columns
            break
        if i != index # if not on diagonal
            fp += value
    result = tp / (tp + fp)
    return parseFloat(result).toFixed(2).replace(/\.0+$/, '.0')

getCellWithTooltip = (tdClasses, content, tooltipText) ->
    textDiv = Flow.HTML.template("span.tooltip-text")(tooltipText)
    tooltipDiv = Flow.HTML.template("div.tooltip-tooltip")([content, textDiv])
    Flow.HTML.template("td.#{tdClasses}")(tooltipDiv)

renderMultinomialConfusionMatrix = (title, cm) ->
  cm.columns.push({'name':'Precision', 'type':'long', 'format': '%.2f', 'description': 'Precision'})
  errorColumnIndex = cm.columns.length - 3 # last three cols are Error, Rate Recall
  precisionValues = []
  cm.rowcount += 1 # We will have new row with Precision values
  totalRowIndex = cm.rowcount - 2 # Last two rows will be Totals and Precision
  for column, i in cm.data
      if i < errorColumnIndex
          column.push(calcRecall(cm, i, errorColumnIndex)) # calculate recall for each feature and add it as last column for each row
      if i < totalRowIndex
          precisionValues.push(calcPrecision(cm, i, totalRowIndex)) # calculate precision for each feature and add it as last row for each column
  cm.data.push(precisionValues) # add recall values as new (last) column

  [table, tbody, tr, normal, bold] = Flow.HTML.template 'table.flow-confusion-matrix', 'tbody', 'tr', 'td', 'td.strong'
  tooltip = (tooltipText) ->
      return (content) ->
          getCellWithTooltip('', content, tooltipText)
  tooltipYellowBg = (tooltipText) ->
      return (content) ->
          getCellWithTooltip('.bg-yellow', content, tooltipText)
  tooltipBold = (tooltipText) ->
      return (content) ->
          getCellWithTooltip('.strong', content, tooltipText)
  headers = map cm.columns, (column, i) -> bold column.description
  headers.unshift normal ' ' # NW corner cell
  rows = [tr headers]
  precisionColumnIndex = cm.columns.length - 1
  recallRowIndex = cm.rowcount - 1
  for rowIndex in [0 ... cm.rowcount]
    cells = for column, i in cm.data
      tooltipText = "Actual: #{cm.columns[rowIndex].description}&#013;&#010;Predicted: #{cm.columns[i].description}"
      cell = if i < errorColumnIndex
        if i is rowIndex
          tooltipYellowBg(tooltipText) # Yellow lines on diagonal
        else
          if rowIndex < totalRowIndex
            tooltip(tooltipText) # "Basic" cells inside cm
          else
            if rowIndex is totalRowIndex
                tooltipBold("Total: #{cm.columns[i].description}") # Totals of features
            else
                if rowIndex is recallRowIndex
                    tooltipBold("Recall: #{cm.columns[i].description}") # Precision of features
                else
                    bold
      else
        if rowIndex < totalRowIndex
            tooltipBold("#{cm.columns[i].description}: #{cm.columns[rowIndex].description}") # Error, Rate and Recall of features
        else
            if rowIndex is totalRowIndex and i < precisionColumnIndex
                tooltipBold("Total: #{cm.columns[i].description}") # Totals of Error and Rate
            else
                bold
      # special-format error column
      cell if i is errorColumnIndex then format4f column[rowIndex] else column[rowIndex]
    # Add the corresponding column label
    cells.unshift bold if rowIndex is cm.rowcount - 2 then 'Total' else if rowIndex is cm.rowcount - 1 then 'Recall' else cm.columns[rowIndex].description
    rows.push tr cells

  return params = {
    title: title + if cm.description then " #{cm.description}" else ''
    plot: signal Flow.HTML.render 'div', table tbody rows
    frame: signal null
    controls: signal null
    isCollapsed: no
    canCombineWithFrame: false
  }

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
  renderMultinomialConfusionMatrix: renderMultinomialConfusionMatrix
