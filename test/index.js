/* global phantom */
/* eslint-disable global-require */

import printUsageAndExit from './printUsageAndExit';
import parseOpts from './parseOpts';
import onErrorFunction from './onErrorFunction';
import onResourceErrorFunction from './onResourceErrorFunction';
import onConsoleMessageFunction from './onConsoleMessageFunction';
import onCallbackFunction from './onCallbackFunction';
import waitFor from './waitFor';
import test from './test';
import printErrors from './printErrors';
import statusFunction from './statusFunction';

let excludeFlowName;
let _i;
let _len;

const system = require('system'); // eslint-disable-line import/no-unresolved
const webpage = require('webpage'); // eslint-disable-line import/no-unresolved
phantom.onError = onErrorFunction.bind(this, phantom);
const opts = parseOpts(phantom, system.args.slice(1));
const _ref = opts.hostname;
const hostname = (_ref) != null ? _ref : 'localhost:54321';

console.log(`PHANTOM: Using ${hostname}`);
const timeoutArg = opts.timeout;
const timeout = (timeoutArg) ? 1000 * parseInt(timeoutArg, 10) : 300000;

console.log(`PHANTOM: Using timeout ${timeout}ms`);
const packsArg = opts.packs;
const packNames = packsArg ? packsArg.split(':') : ['examples'];
const excludeFlowsArg = opts.excludeFlows;
const excludeFlowsNames = excludeFlowsArg ? excludeFlowsArg.split(';') : [];

for (_i = 0, _len = excludeFlowsNames.length; _i < _len; _i++) {
  excludeFlowName = excludeFlowsNames[_i];
  console.log(`PHANTOM: Excluding flow: ${excludeFlowName}`);
}

const page = webpage.create();

if (opts.perf) {
  console.log(`PHANTOM: Performance of individual tests will be recorded in perf.csv in output directory: ${opts.outputDir}.`);
  page._outputDir = opts.outputDir;
}

page.onResourceError = onResourceErrorFunction;
page.onConsoleMessage = onConsoleMessageFunction;
page.onCallback = onCallbackFunction.bind(this, page);

page.open(
  `http://${hostname}/flow/index.html`,
  statusFunction.bind(
    this,
    phantom,
    waitFor,
    page,
    packNames,
    opts,
    hostname,
    excludeFlowsNames
  )
);
