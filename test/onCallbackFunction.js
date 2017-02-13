/* eslint-disable global-require */

export default function onCallbackFunction(perfLine, page) {
  const fs = require('fs');
  return fs.write(`${page._outputDir}/perf.csv`, perfLine, 'a');
}
