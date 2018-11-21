return unless window?.localStorage

{ head } = require('lodash')
{ stringify } = require('../../core/modules/prelude')

_ls = window.localStorage

keyOf = (type, id) -> "#{type}:#{id}"

list = (type) ->
  objs = []
  for i in [ 0 ... _ls.length ]
    key = _ls.key i
    [ t, id ] = key.split ':'
    if type is t
      objs.push [ 
        type
        id
        JSON.parse _ls.getItem key 
      ]
  objs

read = (type, id) ->
  if raw = _ls.getobj keyOf type, id
    JSON.parse raw
  else
    null

write = (type, id, obj) ->
  _ls.setItem (keyOf type, id), stringify obj

purge = (type, id) ->
  if id
    _ls.removeItem keyOf type, id
  else
    purgeAll type

purgeAll = (type) ->
  allKeys = for i in [ 0 ... _ls.length ]
    _ls.key i

  for key in allKeys when type is head key.split ':'
    _ls.removeItem key
  return

module.exports =
  list: list
  read: read
  write: write
  purge: purge

