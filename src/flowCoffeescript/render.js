/* eslint no-unused-vars: "error"*/

import { print } from './print';
import { isRoutine } from './isRoutine';

import { safetyWrapCoffeescript } from './safetyWrapCoffeescript';
import { compileCoffeescript } from './compileCoffeescript';
import { parseJavascript } from './parseJavascript';
import { createRootScope } from './createRootScope';
import { removeHoistedDeclarations } from './removeHoistedDeclarations';
import { rewriteJavascript } from './rewriteJavascript';
import { generateJavascript } from './generateJavascript';
import { compileJavascript } from './compileJavascript';
import { executeJavascript } from './executeJavascript';
import evaluate from './evaluate';

import { routinesThatAcceptUnderbarParameter } from '../routinesThatAcceptUnderbarParameter';

// XXX special-case functions so that bodies are not printed with the raw renderer.
export default function render(_, guid, sandbox, input, output) {
  const lodash = window._;
  const Flow = window.Flow;
  console.log('arguments passed to flowCoffeescript render', arguments);
  console.log('input from flowCoffeescript render', input);
  console.log('output from flowCoffeescript render', output);
  let cellResult;
  let outputBuffer;
  sandbox.results[guid] = cellResult = {
    result: Flow.Dataflow.signal(null),
    outputs: outputBuffer = Flow.Async.createBuffer([]),
  };
  outputBuffer.subscribe(evaluate.bind(this, _, output));
  const tasks = [
    safetyWrapCoffeescript(guid),
    compileCoffeescript,
    parseJavascript,
    createRootScope(sandbox),
    removeHoistedDeclarations,
    rewriteJavascript(sandbox),
    generateJavascript,
    compileJavascript,
    executeJavascript(sandbox, print),
  ];
  return Flow.Async.pipe(tasks)(input, error => {
    if (error) {
      output.error(error);
    }
    const result = cellResult.result();
    // console.log('result.name from tasks pipe', result.name);
    // console.log('result from tasks pipe', result);
    if (lodash.isFunction(result)) {
      if (isRoutine(result, sandbox)) {
        // a hack to gradually migrate routines to accept _ as a parameter
        // rather than expect _ to be a global variable
        if (typeof result !== 'undefined' && routinesThatAcceptUnderbarParameter.indexOf(result.name) > -1) {
          return print(result(_), guid, sandbox);
        }
        return print(result(), guid, sandbox);
      }
      return evaluate(_, output, result);
    }
    return output.close(Flow.objectBrowser(_, () => output.end(), 'result', result));
  });
}
