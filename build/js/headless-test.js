var webpage = require('webpage');
var system = require('system');

var opts = parseOpts(system.args.slice(1));
console.log('opts', JSON.stringify(opts));
console.log('Flow Headless Test Successful');
phantom.exit();

function printUsageAndExit(message) {
  console.log("*** " + message + " ***");
  console.log('Usage: phantomjs headless-test.js [--host ip:port] [--timeout seconds] [--packs foo:bar:baz] [--perf date buildId gitHash gitBranch ncpu os jobName outputDir] [--excludeFlows flow1;flow2]');
  console.log('    ip:port      defaults to localhost:54321');
  console.log('    timeout      defaults to 3600');
  console.log('    packs        defaults to examples');
  console.log('    perf         performance of individual tests will be recorded in perf.csv in the output directory');
  console.log('    excludeFlows do not run these flows');
  return phantom.exit(1);
};

function parseOpts(args) {
  var i, opts;
  console.log("Using args " + (args.join(' ')));
  i = 0;
  opts = {};
  while (i < args.length) {
    if (args[i] === "--host") {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['hostname'] = args[i];
    } else if (args[i] === "--timeout") {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['timeout'] = args[i];
    } else if (args[i] === "--packs") {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['packs'] = args[i];
    } else if (args[i] === "--perf") {
      opts['perf'] = true;
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['date'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['buildId'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['gitHash'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['gitBranch'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['ncpu'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['os'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['jobName'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['outputDir'] = args[i];
    } else if (args[i] === "--excludeFlows") {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['excludeFlows'] = args[i];
    } else {
      printUsageAndExit("Unknown argument: " + args[i]);
    }
    i = i + 1;
  }
  return opts;
};
