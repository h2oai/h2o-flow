export default function goFunction(error) {
  if (error) {
    console.log('*** ERROR *** Error running packs');
    const _ref1 = error.message;
    window._phantom_errors_ = _ref1 != null ? _ref1 : error;
  } else {
    console.log('Finished running all packs!');
  }
  window._phantom_exit_ = true;
  return window._phantom_exit_;
}
