import waitForFlow from './waitForFlow';
import doFlow from './doFlow';

export default function test(
  page,
  packNames,
  opts,
  hostname,
  excludeFlowsNames
) {
  console.log('test function was called');
  return page.evaluate((
        packNames,
        date,
        buildId,
        gitHash,
        gitBranch,
        hostname,
        ncpu,
        os,
        jobName,
        perf,
        excludeFlowsNames
      ) => {
    let context;
        // var runPack;
        // var runPacks;
    window._date = date;
    window._buildId = buildId;
    window._gitHash = gitHash;
    window._gitBranch = gitBranch;
    window._hostname = hostname;
    window._ncpu = ncpu;
    window._os = os;
    window._jobName = jobName;
    window._perf = perf;
    window._excludeFlowsNames = excludeFlowsNames;
        // context = window.flow.context;
    if (window._phantom_started_) {
      if (window._phantom_exit_) {
        return true;
      }
      return false;
    }
    // runPacks = function(go) {
    //   var tasks;
    //   window._phantom_test_summary_ = {};
    //   tasks = packNames.map(function(packName) {
    //     return function(go) {
    //       return runPack(packName, go);
    //     };
    //   });
    //   return (Flow.Async.iterate(tasks))(go);
    // };
    // runPack = function(packName, go) {
    //   console.log("Fetching pack: " + packName + "...");
    //   return context.requestPack(packName, function(error, flowNames) {
    //     var tasks;
    //     if (error) {
    //       console.log("*** ERROR *** Failed fetching pack " + packName);
    //       return go(new Error("Failed fetching pack " + packName, error));
    //     } else {
    //       console.log('Processing pack...');
    //       tasks = flowNames.map(function(flowName) {
    //         return function(go) {
    //           return runFlow(packName, flowName, go);
    //         };
    //       });
    //       return (Flow.Async.iterate(tasks))(go);
    //     }
    //   });
    // };
    console.log('Starting tests...');
    window._phantom_errors_ = null;
    window._phantom_started_ = true;
      // runPacks(function(error) {
      //   var _ref1;
      //   if (error) {
      //     console.log('*** ERROR *** Error running packs');
      //     window._phantom_errors_ = (_ref1 = error.message) != null ? _ref1 : error;
      //   } else {
      //     console.log('Finished running all packs!');
      //   }
      //   return window._phantom_exit_ = true;
      // });
    return false;
  },
      packNames,
      opts.date,
      opts.buildId,
      opts.gitHash,
      opts.gitBranch,
      hostname,
      opts.ncpu,
      opts.os,
      opts.jobName,
      opts.perf,
      excludeFlowsNames
    );
}
