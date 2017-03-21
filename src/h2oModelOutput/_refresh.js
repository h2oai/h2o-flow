import createOutput from './createOutput';

export default function _refresh(_, refresh) {
  console.log('arguments passed to _refresh', arguments);
  const lodash = window._;
  refresh((error, model) => {
    if (!error) {
      _.output(createOutput(_));
      if (_.isLive()) {
        return lodash.delay(_refresh.bind(this, _, refresh), 2000);
      }
    }
  });
}
