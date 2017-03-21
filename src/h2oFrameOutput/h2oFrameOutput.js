/* eslint no-unused-vars: "error"*/

import createModel from './createModel';
import inspect from './inspect';
import inspectData from './inspectData';
import splitFrame from './splitFrame';
import predict from './predict';
import download from './download';
import exportFrame from './exportFrame';
import deleteFrame from './deleteFrame';
import renderFrame from './renderFrame';

import { formatBytes } from '../utils/formatBytes';

export function h2oFrameOutput(_, _go, _frame) {
  const lodash = window._;
  const Flow = window.Flow;
  _.frame = _frame;
  let _lastUsedSearchTerm;
  const MaxItemsPerPage = 20;
  _.grid = Flow.Dataflow.signal(null);
  const _chunkSummary = Flow.Dataflow.signal(null);
  const _distributionSummary = Flow.Dataflow.signal(null);
  const _columnNameSearchTerm = Flow.Dataflow.signal(null);
  const _currentPage = Flow.Dataflow.signal(0);
  const _maxPages = Flow.Dataflow.signal(Math.ceil(_.frame.total_column_count / MaxItemsPerPage));
  const _canGoToPreviousPage = Flow.Dataflow.lift(_currentPage, index => index > 0);
  const _canGoToNextPage = Flow.Dataflow.lift(_maxPages, _currentPage, (maxPages, index) => index < maxPages - 1);
  _lastUsedSearchTerm = null;

  // some messy state here
  // attempting to abstract this out produces an error
  // defer for now
  const refreshColumns = pageIndex => {
    const searchTerm = _columnNameSearchTerm();
    if (searchTerm !== _lastUsedSearchTerm) {
      pageIndex = 0;
    }
    const startIndex = pageIndex * MaxItemsPerPage;
    const itemCount = startIndex + MaxItemsPerPage < _.frame.total_column_count ? MaxItemsPerPage : _.frame.total_column_count - startIndex;
    return _.requestFrameSummarySliceE(_, _.frame.frame_id.name, searchTerm, startIndex, itemCount, (error, frame) => {
      if (error) {
        // empty
        // TODO
      } else {
        _lastUsedSearchTerm = searchTerm;
        _currentPage(pageIndex);
        return renderFrame(_, _chunkSummary, _distributionSummary, frame);
      }
    });
  };
  const goToPreviousPage = () => {
    const currentPage = _currentPage();
    if (currentPage > 0) {
      refreshColumns(currentPage - 1);
    }
  };
  const goToNextPage = () => {
    const currentPage = _currentPage();
    if (currentPage < _maxPages() - 1) {
      refreshColumns(currentPage + 1);
    }
  };
  Flow.Dataflow.react(_columnNameSearchTerm, lodash.throttle(refreshColumns, 500));
  renderFrame(_, _chunkSummary, _distributionSummary, _.frame);
  lodash.defer(_go);
  return {
    key: _.frame.frame_id.name,
    rowCount: _.frame.rows,
    columnCount: _.frame.total_column_count,
    size: formatBytes(_.frame.byte_size),
    chunkSummary: _chunkSummary,
    distributionSummary: _distributionSummary,
    columnNameSearchTerm: _columnNameSearchTerm,
    grid: _.grid,
    inspect: inspect.bind(this, _),
    createModel: createModel.bind(this, _),
    inspectData: inspectData.bind(this, _),
    splitFrame: splitFrame.bind(this, _),
    predict: predict.bind(this, _),
    download: download.bind(this, _),
    exportFrame: exportFrame.bind(this, _),
    canGoToPreviousPage: _canGoToPreviousPage,
    canGoToNextPage: _canGoToNextPage,
    goToPreviousPage,
    goToNextPage,
    deleteFrame: deleteFrame.bind(this, _),
    template: 'flow-frame-output',
  };
}

