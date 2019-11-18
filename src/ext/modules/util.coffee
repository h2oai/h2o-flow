aesjs = require('aes-js')
{ map } = require("lodash")

util = require('../../core/modules/util')

validateFileExtension = (filename, extension) ->
  -1 isnt filename.indexOf extension, filename.length - extension.length

getFileBaseName = (filename, extension) ->
  util.sanitizeName filename.substr 0, filename.length - extension.length


key = [64, 14, 190, 99, 77, 107, 95, 26, 211, 235, 41, 125, 110, 237, 151, 148]
encryptPassword = (password) ->
  aesCtr = new aesjs.ModeOfOperation.ctr key, new aesjs.Counter 5;
  passwordBytes = aesjs.utils.utf8.toBytes password
  encryptedBytes = aesCtr.encrypt passwordBytes
  aesjs.utils.hex.fromBytes encryptedBytes

decryptPassword = (encrypted) ->
  aesCtr = new aesjs.ModeOfOperation.ctr key, new aesjs.Counter 5;
  encryptedBytes = aesjs.utils.hex.toBytes encrypted
  passwordBytes = aesCtr.decrypt encryptedBytes
  aesjs.utils.utf8.fromBytes passwordBytes

module.exports =
  validateFileExtension: validateFileExtension
  getFileBaseName: getFileBaseName
  encryptPassword: encryptPassword
  decryptPassword: decryptPassword