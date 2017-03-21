export function formatClockTime(date) {
  const moment = window.moment;
  return moment(date).format('h:mm:ss a');
}
