significantDigitsBeforeDecimal = (value) -> 1 + Math.floor Math.log(Math.abs value) / Math.LN10

Digits = (digits, value) ->
  if value is 0
    0
  else
    sd = significantDigitsBeforeDecimal value
    if sd >= digits
      value.toFixed 0
    else
      magnitude = Math.pow 10, digits - sd
      Math.round(value * magnitude) / magnitude

formatTime = d3.time.format '%Y-%m-%d %H:%M:%S' unless exports?

formatDate = (time) -> if time then formatTime new Date time else '-'

__formatReal = {}
formatReal = (precision) ->
  format = if cached = __formatReal[precision]
    cached
  else
    __formatReal[precision] = if precision is -1
      identity
    else
      d3.format ".#{precision}f"

  (value) -> format value

Flow.Format =
  Digits: Digits
  Real: formatReal
  Date: formatDate
  Time: formatTime

