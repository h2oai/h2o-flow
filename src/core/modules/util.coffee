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

Flow.Util =
  describeCount: describeCount
  fromNow: fromNow


