import { download } from './download';
import { http } from './http';
import { doGet } from './doGet';
import { doPost } from './doPost';
import { doPostJSON } from './doPostJSON';
import { doUpload } from './doUpload';
import { doDelete } from './doDelete';
import { composePath } from './composePath';
import { requestWithOpts } from './requestWithOpts';
import { encodeArrayForPost } from './encodeArrayForPost';
import { encodeObjectForPost } from './encodeObjectForPost';
import { unwrap } from './unwrap';
import { requestSplitFrame } from './requestSplitFrame';
import { requestFrames } from './requestFrames';
import { requestFrameSlice } from './requestFrameSlice';
import { requestFrameSummary } from './requestFrameSummary';
import { requestFrameSummaryWithoutData } from './requestFrameSummaryWithoutData';
import { requestDeleteFrame } from './requestDeleteFrame';
import { requestFileGlob } from './requestFileGlob';
import { getLines } from './getLines';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oProxy(_) {
  const lodash = window._;
  const Flow = window.Flow;
  const $ = window.jQuery;
  let _storageConfigurations;

  // abstracting out these two functions
  // produces an error
  // defer for now
  const requestImportFiles = (paths, go) => {
    const tasks = lodash.map(paths, path => go => requestImportFile(path, go));
    return Flow.Async.iterate(tasks)(go);
  };
  const requestImportFile = (path, go) => {
    const opts = { path: encodeURIComponent(path) };
    return requestWithOpts(_, '/3/ImportFiles', opts, go);
  };

  // setup a __ namespace for our modelBuilders cache
  _.__ = {};
  _.__.modelBuilders = null;
  _.__.modelBuilderEndpoints = null;
  _.__.gridModelBuilderEndpoints = null;
  Flow.Dataflow.link(_.requestSplitFrame, requestSplitFrame);
  Flow.Dataflow.link(_.requestFrames, requestFrames);
  Flow.Dataflow.link(_.requestFrameSlice, requestFrameSlice);
  Flow.Dataflow.link(_.requestFrameSummary, requestFrameSummary);
  Flow.Dataflow.link(_.requestFrameSummaryWithoutData, requestFrameSummaryWithoutData);
  Flow.Dataflow.link(_.requestDeleteFrame, requestDeleteFrame);
  Flow.Dataflow.link(_.requestFileGlob, requestFileGlob);
  Flow.Dataflow.link(_.requestImportFiles, requestImportFiles);
  Flow.Dataflow.link(_.requestImportFile, requestImportFile);
}
