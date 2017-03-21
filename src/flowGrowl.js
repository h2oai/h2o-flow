export function flowGrowl(_) {
  const Flow = window.Flow;
  const $ = window.jQuery;
  // Type should be one of:
  // undefined = info (blue)
  // success (green)
  // warning (orange)
  // danger (red)
  return Flow.Dataflow.link(_.growl, (message, type) => {
    if (type) {
      return $.bootstrapGrowl(message, { type });
    }
    return $.bootstrapGrowl(message);
  });
}

