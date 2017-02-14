import runPack from './runPack';

export default function runPacks(packNames, go, context) {
  window._phantom_test_summary_ = {};
  const tasks = packNames.map(packName => go => runPack(packName, go, context));
  return (window.Flow.Async.iterate(tasks))(go);
}
