export default function retest(
  phantom,
  startTime,
  timeout,
  isComplete,
  test,
  onReady,
  interval
) {
  if ((new Date().getTime() - startTime < timeout) && !isComplete) {
    console.log('PHANTOM: PING');
    isComplete = test();
    return isComplete;
  }
  if (isComplete) {
    onReady();
    return clearInterval(interval);
  }
  console.log('PHANTOM: *** ERROR *** Timeout Exceeded');
  return phantom.exit(1);
}
