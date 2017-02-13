import printUsageAndExit from './printUsageAndExit';

export default function parseOpts(phantom, args) {
  console.log('parseOpts was called');
  let i;
  console.log(`Using args ${args.join(' ')}`);
  i = 0;
  const opts = {};
  while (i < args.length) {
    if (args[i] === '--host') {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.hostname = args[i];
    } else if (args[i] === '--timeout') {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.timeout = args[i];
    } else if (args[i] === '--packs') {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.packs = args[i];
    } else if (args[i] === '--perf') {
      opts.perf = true;
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.date = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.buildId = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.gitHash = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.gitBranch = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.ncpu = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.os = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.jobName = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.outputDir = args[i];
    } else if (args[i] === '--excludeFlows') {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
      }
      opts.excludeFlows = args[i];
    } else {
      printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
    }
    i = i + 1;
  }
  return opts;
}
