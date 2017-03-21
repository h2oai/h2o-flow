/* eslint no-unused-vars: "error"*/

import { _fork } from './_fork';
import { _join } from './_join';
import { _call } from './_call';
import { _apply } from './_apply';
import { _plot } from './_plot';
import { inspect_ } from './inspect_';
import { flow_ } from './flow_';
import { ls } from './ls';
import { inspectTwoDimTable_ } from './inspectTwoDimTable_';
import { proceed } from './proceed';
import { gui } from './gui';
import { _assistance } from './_assistance';
import { requestFrame } from './requestFrame';
import { requestFrameData } from './requestFrameData';
import { requestColumnSummary } from './requestColumnSummary';
import { requestCreateFrame } from './requestCreateFrame';
import { requestSplitFrame } from './requestSplitFrame';
import { requestMergeFrames } from './requestMergeFrames';
import { requestDeleteFrame } from './requestDeleteFrame';
import { requestExportFrame } from './requestExportFrame';
import { requestModels } from './requestModels';
import { requestImputeColumn } from './requestImputeColumn';
import { requestChangeColumnType } from './requestChangeColumnType';
import { requestDeleteModel } from './requestDeleteModel';
import { requestImportModel } from './requestImportModel';
import { requestJob } from './requestJob';
import { extendImportResults } from './extendImportResults';
import { requestImportAndParseSetup } from './requestImportAndParseSetup';
import { requestImportAndParseFiles } from './requestImportAndParseFiles';
import { requestParseFiles } from './requestParseFiles';
import { requestModelBuild } from './requestModelBuild';
import { requestPredict } from './requestPredict';
import { requestParseSetup } from './requestParseSetup';
import { requestCancelJob } from './requestCancelJob';
import { requestPartialDependence } from './requestPartialDependence';
import { requestPartialDependenceData } from './requestPartialDependenceData';
import { requestExportModel } from './requestExportModel';
import { testNetwork } from './testNetwork';
import { getFrames } from './getFrames';
import { requestBindFrames } from './requestBindFrames';
import { getGrids } from './getGrids';
import { getCloud } from './getCloud';
import { getTimeline } from './getTimeline';
import { getStackTrace } from './getStackTrace';
import { requestLogFile } from './requestLogFile';
import { deleteAll } from './deleteAll';
import { requestProfile } from './requestProfile';
import { requestAutoModelBuild } from './requestAutoModelBuild';
import { requestDeleteModels } from './requestDeleteModels';
import { requestModelsByKeys } from './requestModelsByKeys';
import { requestDeleteFrames } from './requestDeleteFrames';
import { requestModel } from './requestModel';
import { requestPrediction } from './requestPrediction';
import { requestFrameSummarySlice } from './requestFrameSummarySlice';
import { requestFrameSummary } from './requestFrameSummary';
import { getJobs } from './getJobs';
import roomscaleScatterplotInput from '../roomscaleScatterplotInput';
import showRoomscaleScatterplot from '../showRoomscaleScatterplot';

import { h2oInspectsOutput } from '../h2oInspectsOutput';
import { h2oInspectOutput } from '../h2oInspectOutput';
import { h2oPlotOutput } from '../h2oPlotOutput';
import { h2oPlotInput } from '../h2oPlotInput';
import { h2oGridOutput } from '../h2oGridOutput';
import { h2oPredictsOutput } from '../h2oPredictsOutput';
import { h2oH2OFrameOutput } from '../h2oH2OFrameOutput';
import { h2oRDDsOutput } from '../h2oRDDsOutput';
import { h2oDataFramesOutput } from '../h2oDataFramesOutput';
import { h2oScalaCodeOutput } from '../h2oScalaCodeOutput';
import { h2oScalaIntpOutput } from '../h2oScalaIntpOutput';
import { h2oAssist } from '../h2oAssist';
import { h2oImportFilesInput } from '../h2oImportFilesInput';
import { h2oAutoModelInput } from '../h2oAutoModelInput';
import { h2oPredictInput } from '../h2oPredictInput';
import { h2oCreateFrameInput } from '../h2oCreateFrameInput';
import { h2oSplitFrameInput } from '../h2oSplitFrameInput';
import { h2oMergeFramesInput } from '../h2oMergeFramesInput';
import { h2oPartialDependenceInput } from '../h2oPartialDependenceInput/h2oPartialDependenceInput';
import { h2oExportFrameInput } from '../h2oExportFrameInput';
import { h2oImportModelInput } from '../h2oImportModelInput';
import { h2oExportModelInput } from '../h2oExportModelInput';
import { h2oNoAssist } from '../h2oNoAssist';
import { h2oDataFrameOutput } from '../h2oDataFrameOutput';
import { h2oModelInput } from '../h2oModelInput/h2oModelInput';
import { h2oImputeInput } from '../h2oImputeInput/h2oImputeInput';

import { getGridRequest } from '../h2oProxy/getGridRequest';
import { getPredictionsRequest } from '../h2oProxy/getPredictionsRequest';
import { getRDDsRequest } from '../h2oProxy/getRDDsRequest';
import { getDataFramesRequest } from '../h2oProxy/getDataFramesRequest';
import { postScalaIntpRequest } from '../h2oProxy/postScalaIntpRequest';
import { postScalaCodeRequest } from '../h2oProxy/postScalaCodeRequest';
import { postAsH2OFrameFromRDDRequest } from '../h2oProxy/postAsH2OFrameFromRDDRequest';
import { postAsH2OFrameFromDFRequest } from '../h2oProxy/postAsH2OFrameFromDFRequest';
import { postAsDataFrameRequest } from '../h2oProxy/postAsDataFrameRequest';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function routines() {
  const lodash = window._;
  const $ = window.jQuery;
  const Flow = window.Flow;
  const H2O = window.H2O;
  const __slice = [].slice;
  const lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
  if (lightning.settings) {
    lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
    lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
  }
  H2O.Routines = _ => {
    let attrname;
    let f;
    let routinesOnSw;

    // TODO move these into Flow.Async
    const _isFuture = Flow.Async.isFuture;
    const _async = Flow.Async.async;
    const _get = Flow.Async.get;

    const render_ = function () {
      const raw = arguments[0];
      const render = arguments[1];
      const args = arguments.length >= 3 ? __slice.call(arguments, 2) : [];
      // Prepend current context (_) and a continuation (go)
      flow_(raw).render = go => render(...[
        _,
        go,
      ].concat(args));
      return raw;
    };
    const extendPlot = vis => render_(vis, h2oPlotOutput, vis.element);
    const createPlot = (f, go) => {
      console.log('f from routines createPlot', f);
      if (lodash.isFunction(f)) {
        return _plot(f(lightning), (error, vis) => {
          if (error) {
            return go(error);
          }
          return go(null, extendPlot(vis));
        });
      }
    };
    const inspect = function (a, b) {
      if (arguments.length === 1) {
        return inspect$1(a);
      }
      return inspect$2(a, b);
    };
    const inspect$1 = obj => {
      let attr;
      let inspections;
      let _ref1;
      if (_isFuture(obj)) {
        return _async(inspect, obj);
      }
      let inspectors = void 0;
      if (obj != null) {
        _ref1 = obj._flow_;
        if (_ref1 != null) {
          inspectors = _ref1.inspect;
        }
      }
      if (inspectors) {
        inspections = [];
        for (attr in inspectors) {
          if ({}.hasOwnProperty.call(inspectors, attr)) {
            f = inspectors[attr];
            inspections.push(inspect$2(attr, obj));
          }
        }
        render_(inspections, h2oInspectsOutput, inspections);
        return inspections;
      }
      return {};
    };
    const inspect$2 = (attr, obj) => {
      let inspection;
      if (!attr) {
        return;
      }
      if (_isFuture(obj)) {
        return _async(inspect, attr, obj);
      }
      if (!obj) {
        return;
      }
      const root = obj._flow_;
      if (!root) {
        return;
      }
      const inspectors = root.inspect;
      if (!inspectors) {
        return;
      }
      const key = `inspect_${attr}`;
      const cached = root._cache_[key];
      if (cached) {
        return cached;
      }
      f = inspectors[attr];
      if (!f) {
        return;
      }
      if (!lodash.isFunction(f)) {
        return;
      }
      root._cache_[key] = inspection = f();
      render_(inspection, h2oInspectOutput, inspection);
      return inspection;
    };
    const plot = f => {
      console.log('f from routines plot', f);
      if (_isFuture(f)) {
        return _fork(proceed, _, h2oPlotInput, f);
      } else if (lodash.isFunction(f)) {
        return _fork(createPlot, f);
      }
      return assist(plot);
    };
    // depends on `plot`
    const grid = f => plot(g => g(g.select(), g.from(f)));

    // depends on `grid`
    const extendGrid = (grid, opts) => {
      let origin;
      origin = `getGrid ${flowPrelude.stringify(grid.grid_id.name)}`;
      if (opts) {
        origin += `, ${flowPrelude.stringify(opts)}`;
      }
      const inspections = {
        summary: inspectTwoDimTable_(origin, 'summary', grid.summary_table),
        scoring_history: inspectTwoDimTable_(origin, 'scoring_history', grid.scoring_history),
      };
      inspect_(grid, inspections);
      return render_(grid, h2oGridOutput, grid);
    };
    // abstracting this out produces an error
    // defer for now
    // the call to the `render_` function is the problematic part
    const extendPredictions = (opts, predictions) => {
      render_(predictions, h2oPredictsOutput, opts, predictions);
      return predictions;
    };
    // depends on `assist`
    const createFrame = opts => {
      if (opts) {
        return _fork(requestCreateFrame, _, opts);
      }
      return assist(createFrame);
    };
    // depends on `assist`
    const splitFrame = (frameKey, splitRatios, splitKeys, seed) => {
      if (seed == null) {
        seed = -1;
      }
      if (frameKey && splitRatios && splitKeys) {
        return _fork(requestSplitFrame, _, frameKey, splitRatios, splitKeys, seed);
      }
      return assist(splitFrame);
    };
    // depends on `assist`
    const mergeFrames = (
      destinationKey,
      leftFrameKey,
      leftColumnIndex,
      includeAllLeftRows,
      rightFrameKey,
      rightColumnIndex,
      includeAllRightRows
    ) => {
      if (destinationKey && leftFrameKey && rightFrameKey) {
        return _fork(requestMergeFrames, _, destinationKey, leftFrameKey, leftColumnIndex, includeAllLeftRows, rightFrameKey, rightColumnIndex, includeAllRightRows);
      }
      return assist(mergeFrames);
    };

    // depends on `assist`
    // define the function that is called when
    // the Partial Dependence plot input form
    // is submitted
    const buildPartialDependence = opts => {
      if (opts) {
        return _fork(requestPartialDependence, _, opts);
      }
      // specify function to call if user
      // provides malformed input
      return assist(buildPartialDependence);
    };
    // depends on `assist`
    const getPartialDependence = destinationKey => {
      if (destinationKey) {
        return _fork(requestPartialDependenceData, _, destinationKey);
      }
      return assist(getPartialDependence);
    };
    const buildRoomscaleScatterplot = options => {
      if (options) {
        return _fork(showRoomscaleScatterplot, _, options);
      }
      return assist(buildRoomscaleScatterplot);
    };
    // depends on `assist`
    const getFrame = frameKey => {
      switch (flowPrelude.typeOf(frameKey)) {
        case 'String':
          return _fork(requestFrame, _, frameKey);
        default:
          return assist(getFrame);
      }
    };
    // blocked by CoffeeScript codecell `_` issue
    // has multiple parameters
    const bindFrames = (key, sourceKeys) => _fork(requestBindFrames, _, key, sourceKeys);
    // depends on `assist`
    const getFrameSummary = frameKey => {
      switch (flowPrelude.typeOf(frameKey)) {
        case 'String':
          return _fork(requestFrameSummary, _, frameKey);
        default:
          return assist(getFrameSummary);
      }
    };
    // depends on `assist`
    const getFrameData = frameKey => {
      switch (flowPrelude.typeOf(frameKey)) {
        case 'String':
          return _fork(requestFrameData, _, frameKey, void 0, 0, 20);
        default:
          return assist(getFrameSummary);
      }
    };
    // depends on `assist`
    const deleteFrame = frameKey => {
      if (frameKey) {
        return _fork(requestDeleteFrame, _, frameKey);
      }
      return assist(deleteFrame);
    };

    // depends on `assist`
    const exportFrame = (frameKey, path, opts) => {
      if (opts == null) {
        opts = {};
      }
      if (frameKey && path) {
        return _fork(requestExportFrame, _, frameKey, path, opts);
      }
      return assist(exportFrame, frameKey, path, opts);
    };
    // depends on `assist`
    const deleteFrames = frameKeys => {
      switch (frameKeys.length) {
        case 0:
          return assist(deleteFrames);
        case 1:
          return deleteFrame(lodash.head(frameKeys));
        default:
          return _fork(requestDeleteFrames, _, frameKeys);
      }
    };
    // blocked by CoffeeScript codecell `_` issue - multiple parameters
    const getColumnSummary = (frameKey, columnName) => _fork(requestColumnSummary, _, frameKey, columnName);
    // blocked by CoffeeScript codecell `_` issue - multiple parameters
    const getModels = modelKeys => {
      if (lodash.isArray(modelKeys)) {
        if (modelKeys.length) {
          return _fork(requestModelsByKeys, _, modelKeys);
        }
        return _fork(requestModels, _);
      }
      return _fork(requestModels, _);
    };
    // depends on `assist`
    const getModel = modelKey => {
      switch (flowPrelude.typeOf(modelKey)) {
        case 'String':
          return _fork(requestModel, _, modelKey);
        default:
          return assist(getModel);
      }
    };
    // depends on `extendGrid`
    const requestGrid = (gridKey, opts, go) => getGridRequest(_, gridKey, opts, (error, grid) => {
      if (error) {
        return go(error);
      }
      return go(null, extendGrid(grid, opts));
    });
    // depends on `assist`
    const getGrid = (gridKey, opts) => {
      switch (flowPrelude.typeOf(gridKey)) {
        case 'String':
          return _fork(requestGrid, gridKey, opts);
        default:
          return assist(getGrid);
      }
    };
    // depends on `assist`
    const imputeColumn = opts => {
      if (opts && opts.frame && opts.column && opts.method) {
        return _fork(requestImputeColumn, _, opts);
      }
      return assist(imputeColumn, opts);
    };
    // depends on `assist`
    const changeColumnType = opts => {
      if (opts && opts.frame && opts.column && opts.type) {
        return _fork(requestChangeColumnType, _, opts);
      }
      return assist(changeColumnType, opts);
    };
    // depends on `assist`
    const deleteModel = modelKey => {
      if (modelKey) {
        return _fork(requestDeleteModel, _, modelKey);
      }
      return assist(deleteModel);
    };

    // depends on `assist`
    const importModel = (path, opts) => {
      if (path && path.length) {
        return _fork(requestImportModel, _, path, opts);
      }
      return assist(importModel, path, opts);
    };

    // depends on `assist`
    const exportModel = (modelKey, path, opts) => {
      if (modelKey && path) {
        return _fork(requestExportModel, _, modelKey, path, opts);
      }
      return assist(exportModel, modelKey, path, opts);
    };
    // depends on `assist`
    const deleteModels = modelKeys => {
      switch (modelKeys.length) {
        case 0:
          return assist(deleteModels);
        case 1:
          return deleteModel(lodash.head(modelKeys));
        default:
          return _fork(requestDeleteModels, _, modelKeys);
      }
    };
    // depends on `assist`
    const getJob = arg => {
      switch (flowPrelude.typeOf(arg)) {
        case 'String':
          return _fork(requestJob, _, arg);
        case 'Object':
          if (arg.key != null) {
            return getJob(arg.key);
          }
          return assist(getJob);
          // break; // no-unreachable
        default:
          return assist(getJob);
      }
    };
    // depends on `assist`
    const cancelJob = arg => {
      switch (flowPrelude.typeOf(arg)) {
        case 'String':
          return _fork(requestCancelJob, _, arg);
        default:
          return assist(cancelJob);
      }
    };
    // abstracting this out causes an error
    // defer for now
    const requestImportFiles = (paths, go) => _.requestImportFiles(paths, (error, importResults) => {
      if (error) {
        return go(error);
      }
      return go(null, extendImportResults(_, importResults));
    });
    // depends on `assist`
    const importFiles = paths => {
      switch (flowPrelude.typeOf(paths)) {
        case 'Array':
          return _fork(requestImportFiles, paths);
        default:
          return assist(importFiles);
      }
    };
    // depends on `assist`
    const setupParse = args => {
      if (args.paths && lodash.isArray(args.paths)) {
        return _fork(requestImportAndParseSetup, _, args.paths);
      } else if (args.source_frames && lodash.isArray(args.source_frames)) {
        return _fork(requestParseSetup, _, args.source_frames);
      }
      return assist(setupParse);
    };
    // blocked by CoffeeScript codecell `_` issue - has arguments
    const parseFiles = opts => {
      const destinationKey = opts.destination_frame;
      const parseType = opts.parse_type;
      const separator = opts.separator;
      const columnCount = opts.number_columns;
      const useSingleQuotes = opts.single_quotes;
      const columnNames = opts.column_names;
      const columnTypes = opts.column_types;
      const deleteOnDone = opts.delete_on_done;
      const checkHeader = opts.check_header;
      const chunkSize = opts.chunk_size;
      if (opts.paths) {
        return _fork(requestImportAndParseFiles, _, opts.paths, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize);
      }
      return _fork(requestParseFiles, _, opts.source_frames, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize);
    };
    // depends on `assist`
    const buildAutoModel = opts => {
      if (opts && lodash.keys(opts).length > 1) {
        return _fork(requestAutoModelBuild, _, opts);
      }
      return assist(buildAutoModel, opts);
    };
    // depends on `assist`
    const buildModel = (algo, opts) => {
      if (algo && opts && lodash.keys(opts).length > 1) {
        return _fork(requestModelBuild, _, algo, opts);
      }
      return assist(buildModel, algo, opts);
    };
    // depends on `extendPredictions`
    const requestPredicts = (opts, go) => {
      const futures = lodash.map(opts, opt => {
        const modelKey = opt.model;
        const frameKey = opt.frame;
        const options = opt.options;
        return _fork(_.requestPredict, _, null, modelKey, frameKey, options || {});
      });
      return Flow.Async.join(futures, (error, predictions) => {
        if (error) {
          return go(error);
        }
        return go(null, extendPredictions(opts, predictions));
      });
    };
    // depends on `assist`
    const predict = opts => {
      let combos;
      let frame;
      let frames;
      let model;
      let models;
      let _i;
      let _j;
      let _len;
      let _len1;
      if (opts == null) {
        opts = {};
      }
      // eslint-disable-next-line camelcase
      const predictions_frame = opts.predictions_frame;
      model = opts.model;
      models = opts.models;
      frame = opts.frame;
      frames = opts.frames;
      // eslint-disable-next-line camelcase
      const reconstruction_error = opts.reconstruction_error;
      // eslint-disable-next-line camelcase
      const deep_features_hidden_layer = opts.deep_features_hidden_layer;
      // eslint-disable-next-line camelcase
      const leaf_node_assignment = opts.leaf_node_assignment;
      // eslint-disable-next-line camelcase
      const exemplar_index = opts.exemplar_index;
      if (models || frames) {
        if (!models) {
          if (model) {
            models = [model];
          }
        }
        if (!frames) {
          if (frame) {
            frames = [frame];
          }
        }
        if (frames && models) {
          combos = [];
          for (_i = 0, _len = models.length; _i < _len; _i++) {
            model = models[_i];
            for (_j = 0, _len1 = frames.length; _j < _len1; _j++) {
              frame = frames[_j];
              combos.push({
                model,
                frame,
              });
            }
          }
          return _fork(requestPredicts, combos);
        }
        return assist(predict, {
          predictions_frame,
          models,
          frames,
        });
      }
      if (model && frame) {
        return _fork(requestPredict, _, predictions_frame, model, frame, {
          reconstruction_error,
          deep_features_hidden_layer,
          leaf_node_assignment,
        });
      } else if (model && exemplar_index !== void 0) { // eslint-disable-line camelcase
        return _fork(requestPredict, _, predictions_frame, model, null, { exemplar_index });
      }
      return assist(predict, {
        predictions_frame,
        model,
        frame,
      });
    };
    // depends on `extendPredictions`
    const requestPredictions = (opts, go) => {
      if (lodash.isArray(opts)) {
        const futures = lodash.map(opts, opt => {
          const modelKey = opt.model;
          const frameKey = opt.frame;
          return _fork(getPredictionsRequest, _, modelKey, frameKey);
        });
        return Flow.Async.join(futures, (error, predictions) => {
          if (error) {
            return go(error);
          }
          const uniquePredictions = lodash.values(lodash.indexBy(lodash.flatten(predictions, true), prediction => prediction.model.name + prediction.frame.name));
          return go(null, extendPredictions(opts, uniquePredictions));
        });
      }
      const modelKey = opts.model;
      const frameKey = opts.frame;
      return getPredictionsRequest(_, modelKey, frameKey, (error, predictions) => {
        if (error) {
          return go(error);
        }
        return go(null, extendPredictions(opts, predictions));
      });
    };
    // blocked by CoffeeScript codecell `_` issue - has arguments
    const getPrediction = opts => {
      if (opts == null) {
        opts = {};
      }
      // eslint-disable-next-line camelcase
      const predictions_frame = opts.predictions_frame;
      const model = opts.model;
      const frame = opts.frame;
      if (model && frame) {
        return _fork(requestPrediction, _, model, frame);
      }
      return assist(getPrediction, {
        predictions_frame,
        model,
        frame,
      });
    };
    // blocked by CoffeeScript codecell `_` issue - has arguements
    const getPredictions = opts => {
      if (opts == null) {
        opts = {};
      }
      return _fork(requestPredictions, opts);
    };
    // blocked by CoffeeScript codecell `_` issue - has arguements
    const getLogFile = (nodeIndex, fileType) => {
      if (nodeIndex == null) {
        nodeIndex = -1;
      }
      if (fileType == null) {
        fileType = 'info';
      }
      return _fork(requestLogFile, _, nodeIndex, fileType);
    };
    //
    // start Sparkling Water Routines
    //

    // Sparkling Water Routines are hard to test
    // since we have to build h2o-3
    // then also build Sparkling Water
    // everytime we want to make a change to here that interacts
    // with Sparkling Water
    // this takes about 4 minutes each time
    // for that reason, defer abstracting these routines out
    const extendRDDs = rdds => {
      render_(rdds, h2oRDDsOutput, rdds);
      return rdds;
    };
    const requestRDDs = go => getRDDsRequest(_, (error, result) => {
      if (error) {
        return go(error);
      }
      return go(null, extendRDDs(result.rdds));
    });
    const getRDDs = () => _fork(requestRDDs);
    const extendDataFrames = dataframes => {
      render_(dataframes, h2oDataFramesOutput, dataframes);
      return dataframes;
    };
    const requestDataFrames = go => getDataFramesRequest(_, (error, result) => {
      if (error) {
        return go(error);
      }
      return go(null, extendDataFrames(result.dataframes));
    });
    const getDataFrames = () => _fork(requestDataFrames);
    const extendAsH2OFrame = result => {
      render_(result, h2oH2OFrameOutput, result);
      return result;
    };
    // eslint-disable-next-line camelcase
    const requestAsH2OFrameFromRDD = (rddId, name, go) => postAsH2OFrameFromRDDRequest(_, rddId, name, (error, h2oframe_id) => {
      if (error) {
        return go(error);
      }
      return go(null, extendAsH2OFrame(h2oframe_id));
    });
    const asH2OFrameFromRDD = (rddId, name) => {
      if (name == null) {
        name = void 0;
      }
      return _fork(requestAsH2OFrameFromRDD, rddId, name);
    };
    const requestAsH2OFrameFromDF = (dfId, name, go) => postAsH2OFrameFromDFRequest(_, dfId, name, (error, result) => {
      if (error) {
        return go(error);
      }
      return go(null, extendAsH2OFrame(result));
    });
    const asH2OFrameFromDF = (dfId, name) => {
      if (name == null) {
        name = void 0;
      }
      return _fork(requestAsH2OFrameFromDF, dfId, name);
    };
    const extendAsDataFrame = result => {
      render_(result, h2oDataFrameOutput, result);
      return result;
    };
    const requestAsDataFrame = (hfId, name, go) => postAsDataFrameRequest(_, hfId, name, (error, result) => {
      if (error) {
        return go(error);
      }
      return go(null, extendAsDataFrame(result));
    });
    const asDataFrame = (hfId, name) => {
      if (name == null) {
        name = void 0;
      }
      return _fork(requestAsDataFrame, hfId, name);
    };
    const requestScalaCode = (session_id, code, go) => { // eslint-disable-line camelcase
      console.log('session_id from routines requestScalaCode', session_id);
      return postScalaCodeRequest(_, session_id, code, (error, result) => {
        if (error) {
          return go(error);
        }
        return go(null, extendScalaCode(result));
      });
    };
    const extendScalaCode = result => {
      render_(result, h2oScalaCodeOutput, result);
      return result;
    };
    const runScalaCode = (session_id, code) => { // eslint-disable-line camelcase
      console.log('session_id from routines runScalaCode', session_id);
      return _fork(requestScalaCode, session_id, code);
    };
    const requestScalaIntp = go => postScalaIntpRequest(_, (error, result) => {
      if (error) {
        return go(error);
      }
      return go(null, extendScalaIntp(result));
    });
    const extendScalaIntp = result => {
      render_(result, h2oScalaIntpOutput, result);
      return result;
    };
    const getScalaIntp = () => _fork(requestScalaIntp);
    //
    // end Sparkling Water Routines
    //
    const getProfile = opts => {
      if (!opts) {
        opts = { depth: 10 };
      }
      return _fork(requestProfile, _, opts.depth);
    };
    // `loadScript` is not used anywhere else
    // but could be called from a codecell in Flow
    const loadScript = (path, go) => {
      const onDone = (script, status) => go(null, {
        script,
        status,
      });
      const onFail = (jqxhr, settings, error) => go(error);
      return $.getScript(path).done(onDone).fail(onFail);
    };
    // `dumpFuture` is not used anywhere else
    // but could be called from a codecell in Flow
    const dumpFuture = (result, go) => {
      if (result == null) {
        result = {};
      }
      console.debug(result);
      return go(null, render_(result, Flow.objectBrowser, 'dump', result));
    };
    // `dump` is not used anywhere else
    // but could be called from a codecell in Flow
    const dump = f => {
      if (f != null ? f.isFuture : void 0) {
        return _fork(dumpFuture, f);
      }
      return Flow.Async.async(() => f);
    };
    // abstracting this out produces errors
    // defer for now
    const assist = function () {
      const func = arguments[0];
      const args = arguments.length >= 2 ? __slice.call(arguments, 1) : [];
      if (func === void 0) {
        return _fork(proceed, _, h2oAssist, [_assistance]);
      }
      switch (func) {
        case importFiles:
          return _fork(proceed, _, h2oImportFilesInput, []);
        case buildModel:
          return _fork(proceed, _, h2oModelInput, args);
        case buildAutoModel:
          return _fork(proceed, _, h2oAutoModelInput, args);
        case predict:
        case getPrediction:
          return _fork(proceed, _, h2oPredictInput, args);
        case createFrame:
          return _fork(proceed, _, h2oCreateFrameInput, args);
        case splitFrame:
          return _fork(proceed, _, h2oSplitFrameInput, args);
        case mergeFrames:
          return _fork(proceed, _, h2oMergeFramesInput, args);
        case buildPartialDependence:
          return _fork(proceed, _, h2oPartialDependenceInput, args);
        case exportFrame:
          return _fork(proceed, _, h2oExportFrameInput, args);
        case imputeColumn:
          return _fork(proceed, _, h2oImputeInput, args);
        case importModel:
          return _fork(proceed, _, h2oImportModelInput, args);
        case exportModel:
          return _fork(proceed, _, h2oExportModelInput, args);
        case buildRoomscaleScatterplot:
          return _fork(proceed, _, roomscaleScatterplotInput, args);
        default:
          return _fork(proceed, _, h2oNoAssist, []);
      }
    };
    Flow.Dataflow.link(_.ready, () => {
      Flow.Dataflow.link(_.ls, ls);
      Flow.Dataflow.link(_.inspect, inspect);
      Flow.Dataflow.link(_.plot, plot => plot(lightning));
      Flow.Dataflow.link(_.grid, frame => lightning(lightning.select(), lightning.from(frame)));
      Flow.Dataflow.link(_.enumerate, frame => lightning(lightning.select(0), lightning.from(frame)));
      Flow.Dataflow.link(_.requestFrameDataE, requestFrameData);
      return Flow.Dataflow.link(_.requestFrameSummarySliceE, requestFrameSummarySlice);
    });
    const initAssistanceSparklingWater = () => {
      _assistance.getRDDs = {
        description: 'Get a list of Spark\'s RDDs',
        icon: 'table',
      };
      _assistance.getDataFrames = {
        description: 'Get a list of Spark\'s data frames',
        icon: 'table',
      };
    };
    Flow.Dataflow.link(_.initialized, () => {
      if (_.onSparklingWater) {
        return initAssistanceSparklingWater();
      }
    });
    const routines = {
      //
      // fork/join
      //
      fork: _fork,
      join: _join,
      call: _call,
      apply: _apply,
      isFuture: _isFuture,
      //
      // Dataflow
      //
      signal: Flow.Dataflow.signal,
      signals: Flow.Dataflow.signals,
      isSignal: Flow.Dataflow.isSignal,
      act: Flow.Dataflow.act,
      react: Flow.Dataflow.react,
      lift: Flow.Dataflow.lift,
      merge: Flow.Dataflow.merge,
      //
      // Generic
      //
      dump,
      inspect,
      plot,
      grid,
      get: _get,
      //
      // Meta
      //
      assist,
      //
      // GUI
      //
      gui,
      //
      // Util
      //
      loadScript,
      //
      // H2O
      //
      getJobs,
      getJob,
      cancelJob,
      importFiles,
      setupParse,
      parseFiles,
      createFrame,
      splitFrame,
      mergeFrames,
      buildPartialDependence,
      buildRoomscaleScatterplot,
      showRoomscaleScatterplot,
      getPartialDependence,
      getFrames,
      getFrame,
      bindFrames,
      getFrameSummary,
      getFrameData,
      deleteFrames,
      deleteFrame,
      exportFrame,
      getColumnSummary,
      changeColumnType,
      imputeColumn,
      buildModel,
      buildAutoModel,
      getGrids,
      getModels,
      getModel,
      getGrid,
      deleteModels,
      deleteModel,
      importModel,
      exportModel,
      predict,
      getPrediction,
      getPredictions,
      getCloud,
      getTimeline,
      getProfile,
      getStackTrace,
      getLogFile,
      testNetwork,
      deleteAll,
    };
    if (_.onSparklingWater) {
      routinesOnSw = {
        getDataFrames,
        getRDDs,
        getScalaIntp,
        runScalaCode,
        asH2OFrameFromRDD,
        asH2OFrameFromDF,
        asDataFrame,
      };
      for (attrname in routinesOnSw) {
        if ({}.hasOwnProperty.call(routinesOnSw, attrname)) {
          routines[attrname] = routinesOnSw[attrname];
        }
      }
    }
    return routines;
  };
}
