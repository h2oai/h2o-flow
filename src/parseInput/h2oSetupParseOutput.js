// import constants
import { parseTypesArray } from './parseTypesArray';
import { whitespaceSeparators } from './whitespaceSeparators';
import { dataTypes } from './dataTypes';

// import functions
import { createDelimiter } from './createDelimiter';
import { refreshPreview } from './refreshPreview';
import { makePage } from './makePage';
import { filterColumns } from './filterColumns';
import { parseFiles } from './parseFiles';
import { _columnsAccessorFunction } from './_columnsAccessorFunction';
import { goToNextPage } from './goToNextPage';
import { goToPreviousPage } from './goToPreviousPage';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oSetupParseOutput(_, _go, _inputs, _result) {
  const Flow = window.Flow;
  const lodash = window._;
  const MaxItemsPerPage = 15;
  const parseTypes = parseTypesArray.map(type => ({
    type,
    caption: type,
  }));
  const parseDelimiters = (() => {
    const whitespaceDelimiters = whitespaceSeparators.map(createDelimiter);
    const characterDelimiters = lodash.times(126 - whitespaceSeparators.length, i => {
      const charCode = i + whitespaceSeparators.length;
      return createDelimiter(String.fromCharCode(charCode), charCode);
    });
    const otherDelimiters = [{
      charCode: -1,
      caption: 'AUTO',
    }];
    return whitespaceDelimiters.concat(characterDelimiters, otherDelimiters);
  })();
  let _currentPage;
  const _inputKey = _inputs.paths ? 'paths' : 'source_frames';
  const _sourceKeys = _result.source_frames.map(src => src.name);
  const _parseType = Flow.Dataflow.signal(lodash.find(parseTypes, parseType => parseType.type === _result.parse_type));
  const _canReconfigure = Flow.Dataflow.lift(_parseType, parseType => parseType.type !== 'SVMLight');
  const _delimiter = Flow.Dataflow.signal(lodash.find(parseDelimiters, delimiter => delimiter.charCode === _result.separator));
  const _useSingleQuotes = Flow.Dataflow.signal(_result.single_quotes);
  const _destinationKey = Flow.Dataflow.signal(_result.destination_frame);
  const _headerOptions = {
    auto: 0,
    header: 1,
    data: -1,
  };
  const _headerOption = Flow.Dataflow.signal(_result.check_header === 0 ? 'auto' : _result.check_header === -1 ? 'data' : 'header');
  const _deleteOnDone = Flow.Dataflow.signal(true);
  const _columnNameSearchTerm = Flow.Dataflow.signal('');
  const _preview = Flow.Dataflow.signal(_result);
  const _chunkSize = Flow.Dataflow.lift(_preview, preview => preview.chunk_size);
  const _columns = Flow.Dataflow.lift(_preview, preview => _columnsAccessorFunction(preview));
  const _columnCount = Flow.Dataflow.lift(_columns, columns => (columns != null ? columns.length : void 0) || 0);
  _currentPage = 0;
  Flow.Dataflow.act(_columns, columns => { // eslint-disable-line arrow-body-style
    return columns.forEach(column => { // eslint-disable-line arrow-body-style
      return Flow.Dataflow.react(column.type, () => {
        _currentPage = _activePage().index;
        return refreshPreview(
            _,
            _columns,
            _sourceKeys,
            _parseType,
            _delimiter,
            _useSingleQuotes,
            _headerOptions,
            _headerOption,
            _preview
          );
      });
    });
  });
  Flow.Dataflow.react(_parseType, _delimiter, _useSingleQuotes, _headerOption, () => {
    _currentPage = 0;
    return refreshPreview(
        _,
        _columns,
        _sourceKeys,
        _parseType,
        _delimiter,
        _useSingleQuotes,
        _headerOptions,
        _headerOption,
        _preview,
        _delimiter
      );
  });
  const _filteredColumns = Flow.Dataflow.lift(_columns, columns => columns);
  const _activePage = Flow.Dataflow.lift(_columns, columns => makePage(_currentPage, columns));
  Flow.Dataflow.react(_columnNameSearchTerm, lodash.throttle(filterColumns.bind(this, _activePage, _columns, _columnNameSearchTerm), 500));
  const _visibleColumns = Flow.Dataflow.lift(_activePage, currentPage => {
    const start = currentPage.index * MaxItemsPerPage;
    return currentPage.columns.slice(start, start + MaxItemsPerPage);
  });
  const _canGoToNextPage = Flow.Dataflow.lift(_activePage, currentPage => (currentPage.index + 1) * MaxItemsPerPage < currentPage.columns.length);
  const _canGoToPreviousPage = Flow.Dataflow.lift(_activePage, currentPage => currentPage.index > 0);
  lodash.defer(_go);
  return {
    sourceKeys: _inputs[_inputKey],
    canReconfigure: _canReconfigure,
    parseTypes,
    dataTypes,
    delimiters: parseDelimiters,
    parseType: _parseType,
    delimiter: _delimiter,
    useSingleQuotes: _useSingleQuotes,
    destinationKey: _destinationKey,
    headerOption: _headerOption,
    deleteOnDone: _deleteOnDone,
    columns: _visibleColumns,
    parseFiles: parseFiles.bind(
      this,
      _,
      _columns,
      _headerOptions,
      _headerOption,
      _inputKey,
      _inputs,
      _destinationKey,
      _parseType,
      _delimiter,
      _columnCount,
      _useSingleQuotes,
      _canReconfigure,
      _deleteOnDone,
      _chunkSize
    ),
    columnNameSearchTerm: _columnNameSearchTerm,
    canGoToNextPage: _canGoToNextPage,
    canGoToPreviousPage: _canGoToPreviousPage,
    goToNextPage: goToNextPage.bind(this, _activePage),
    goToPreviousPage: goToPreviousPage.bind(this, _activePage),
    template: 'flow-parse-raw-input',
  };
}
