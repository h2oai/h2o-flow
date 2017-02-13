import waitForFlow from './waitForFlow';
import doFlow from './doFlow';
import runPacks from './runPacks';

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
    console.log('Starting tests...');
    window._phantom_errors_ = null;
    window._phantom_started_ = true;
    // runPacks(
    //   packNames,
    //   function (error) {
    //     var _ref1;
    //     if (error) {
    //       console.log('*** ERROR *** Error running packs');
    //       window._phantom_errors_ = (_ref1 = error.message) != null ? _ref1 : error;
    //     } else {
    //       console.log('Finished running all packs!');
    //     }
    //     return window._phantom_exit_ = true;
    //   },
    //   context
    // );
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
