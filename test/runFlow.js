import doFlow from './doFlow';
import waitForFlow from './waitForFlow';

export default function runFlow(
  packName,
  flowName,
  go,
  context
) {
  console.log('runFlow was called');
  let flowTitle;
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
}
