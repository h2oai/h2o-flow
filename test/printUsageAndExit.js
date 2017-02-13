export default function printUsageAndExit(phantom, message) {
  console.log(`*** ${message} ***`);
  console.log('Usage: phantomjs headless-test.js [--host ip:port] [--timeout seconds] [--packs foo:bar:baz] [--perf date buildId gitHash gitBranch ncpu os jobName outputDir] [--excludeFlows flow1;flow2]');
  console.log('    ip:port      defaults to localhost:54321');
  console.log('    timeout      defaults to 3600');
  console.log('    packs        defaults to examples');
  console.log('    perf         performance of individual tests will be recorded in perf.csv in the output directory');
  console.log('    excludeFlows do not run these flows');
  return phantom.exit(1);
}
