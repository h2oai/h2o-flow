export function fromNow(date) {
  const moment = window.moment;
  return moment(date).fromNow();
}
