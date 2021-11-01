
jobTypePat = /^Key<(\w+)>/

formatJobType = (jobType) ->
  if jobType
    if jobTypePat.test(jobType)
      jobType.replace(jobTypePat, "$1")
    else
      "Unknown"
  else
    "Removed"

module.exports =
  formatJobType: formatJobType
