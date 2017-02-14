export default function statusFunction(
  phantom,
  waitFor,
  page,
  packNames,
  opts,
  hostname,
  excludeFlowsNames,
  status
) {
  let printErrors;
  let test;
  console.log('status from page.open', status);
  if (status === 'success') {
    return waitFor(
      phantom,
      test.bind(
        this,
        page,
        packNames,
        opts,
        hostname,
        excludeFlowsNames
      ),
      () => {
        let flowTitle;
        let testCount;
        let testStatus;
        const errors = page.evaluate(() => window._phantom_errors_);
        if (errors) {
          console.log('------------------ FAILED -------------------');
          console.log(printErrors(errors));
          console.log('---------------------------------------------');
          return phantom.exit(1);
        }
        const summary = page.evaluate(() => window._phantom_test_summary_);
        console.log('------------------ PASSED -------------------');
        testCount = 0;
        for (flowTitle in summary) {
          if (Object.prototype.hasOwnProperty.call(summary, flowTitle)) {
            testStatus = summary[flowTitle];
            console.log(`${testStatus}: ${flowTitle}`);
            testCount++;
          }
        }
        console.log(`(${testCount} tests executed.)`);
        console.log('---------------------------------------------');
        return phantom.exit(0);
      });
  }
  console.log('PHANTOM: *** ERROR *** Unable to access network.');
  return phantom.exit(1);
}
