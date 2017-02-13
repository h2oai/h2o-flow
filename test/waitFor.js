import retest from './retest';

export default function waitFor(
  phantom,
  test,
  onReady,
  timeout
) {
  let interval = undefined;
  const startTime = new Date().getTime();
  const isComplete = false;
  interval = setInterval(
    retest(
      phantom,
      startTime,
      timeout,
      isComplete,
      test,
      onReady,
      interval
    ),
    2000
  );
  return interval;
}
