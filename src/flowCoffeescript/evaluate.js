export default function evaluate(_, output, ft) {
  console.log('arguments from flowCoffeescript evaluate', arguments);
  const Flow = window.Flow;
  if (ft != null ? ft.isFuture : void 0) {
    return ft((error, result) => {
      console.log('error from flowCoffeescript render evaluate', error);
      console.log('result from flowCoffeescript render evaluate', result);
      if (error) {
        console.log('output from flowCoffeescript evaluate', output);
        output.error(new Flow.Error('Error evaluating cell', error));
        return output.end();
      }
      if (typeof result !== 'undefined') {
        console.log('result is defined at flowCoffeescript evaluate');
        if (typeof result._flow_ !== 'undefined') {
          console.log('result._flow_ is defined at flowCoffeescript evaluate');
          if (typeof result._flow_.render !== 'undefined') {
            console.log('result._flow_.render is defined at flowCoffeescript evaluate');
            const returnValue = output.data(result._flow_.render(() => output.end()));
            console.log('returnValue from flowCoffeescript evaluate', returnValue);
            return returnValue;
          }
        }
      }
      return output.data(Flow.objectBrowser(_, (() => output.end())('output', result)));
    });
  }
  return output.data(Flow.objectBrowser(_, () => output.end(), 'output', ft));
}
