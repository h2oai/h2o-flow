import { extendSplitFrameResult } from './extendSplitFrameResult';
import { createTempKey } from './createTempKey';
import { computeSplits } from './computeSplits';
import { requestExec } from '../h2oProxy/requestExec';

export function requestSplitFrame(_, frameKey, splitRatios, splitKeys, seed, go) {
  const Flow = window.Flow;
  let g;
  let i;
  let l;
  let part;
  let randomVecKey;
  let sliceExpr;
  let splits;
  let statements;
  let _i;
  let _len;
  if (splitRatios.length === splitKeys.length - 1) {
    splits = computeSplits(splitRatios, splitKeys);
    randomVecKey = createTempKey();
    statements = [];
    statements.push(`(tmp= ${randomVecKey} (h2o.runif ${frameKey} ${seed}))`);
    for (i = _i = 0, _len = splits.length; _i < _len; i = ++_i) {
      part = splits[i];
      g = i !== 0 ? `(> ${randomVecKey} ${part.min})` : null;
      l = i !== splits.length - 1 ? `(<= ${randomVecKey} ${part.max})` : null;
      if (g && l) {
        sliceExpr = `(& ${g} ${l})`;
      } else {
        if (l) {
          sliceExpr = l;
        } else {
          sliceExpr = g;
        }
      }
      statements.push(`(assign ${part.key} (rows ${frameKey} ${sliceExpr}))`);
    }
    statements.push(`(rm ${randomVecKey})`);
    return requestExec(_, `(, ${statements.join(' ')})`, (error, result) => {
      if (error) {
        return go(error);
      }
      return go(null, extendSplitFrameResult(_, {
        keys: splitKeys,
        ratios: splitRatios,
      }));
    });
  }
  return go(new Flow.Error('The number of split ratios should be one less than the number of split keys'));
}
