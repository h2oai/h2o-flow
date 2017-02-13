import runFlow from './runFlow';

export default function runPack(packName, go, context) {
  console.log(`Fetching pack: ${packName}...`);
  return context.requestPack(packName, (error, flowNames) => {
    if (error) {
      console.log(`*** ERROR *** Failed fetching pack ${packName}`);
      return go(new Error(`Failed fetching pack ${packName}`, error));
    }
    console.log('Processing pack...');
    const tasks = flowNames.map(flowName => go => runFlow(packName, flowName, go));
    return (window.Flow.Async.iterate(tasks))(go);
  });
}
