export default function waitForFlow(go, context) {
  if (window._phantom_running_) {
    console.log('ACK');
    return setTimeout(waitForFlow, 2000);
  }
  console.log('Flow completed!');
  const errors = window._phantom_errors_;
  return context.requestRemoveAll(() => go(errors));
}
