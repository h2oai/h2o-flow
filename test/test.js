import waitForFlow from './waitForFlow';

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
    const runFlow = (packName, flowName, go) => {
      console.log('runFlow was called');
      let flowTitle;
      const doFlow = (flowName, excludeFlowsNames) => {
        let f;
        let _j;
        let _len1;
        for (_j = 0, _len1 = excludeFlowsNames.length; _j < _len1; _j++) {
          f = excludeFlowsNames[_j];
          if (flowName === f) {
            return false;
          }
        }
        return true;
      };
      if (doFlow(flowName, window._excludeFlowsNames)) {
        flowTitle = `${packName} - ${flowName}`;
        window._phantom_test_summary_[flowTitle] = 'FAILED';
        console.log(`Fetching flow document: ${packName} - ${flowName}...`);
        return context.requestFlow(packName, flowName, (error, flow) => {
          if (error) {
            console.log(`*** ERROR *** Failed fetching flow ${flowTitle}`);
            go(new Error(`Failed fetching flow ${flowTitle}`, error));
          } else {
            console.log(`Opening flow ${flowTitle}...`);
            window._phantom_running_ = true;
            context.open(flowTitle, flow);
            console.log('Running flow...');
            window._startTime = new Date().getTime() / 1000;
            context.executeAllCells(true, (status, errors) => {
              window._endTime = new Date().getTime() / 1000;
              console.log(`Flow finished with status: ${status}`);
              if (status === 'failed') {
                window._pass = 0;
                window._phantom_errors_ = errors;
              } else {
                window._pass = 1;
                window._phantom_test_summary_[flowTitle] = 'PASSED';
              }
              if (window._perf) {
                window.callPhantom(`${window._date}, ${window._buildId}, ${window._gitHash}, ${window._gitBranch}, ${window._hostname}, ${flowName}, ${window._startTime}, ${window._endTime}, ${window._pass}, ${window._ncpu}, ${window._os}, ${window._jobName}\n`);
              }
              window._phantom_running_ = false;
              return window._phantom_running_;
            });
          }
          return setTimeout(
            waitForFlow.bind(this, go, context),
            2000
          );
        });
      }
      console.log(`Ignoring flow: ${flowName}`);
      return go(null);
    };
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
