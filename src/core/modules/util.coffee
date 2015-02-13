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

Flow.Util =
  describeCount: describeCount
  fromNow: fromNow
  formatBytes: formatBytes


