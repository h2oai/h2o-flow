import { extendParseResult } from './extendParseResult';
import { postParseFilesRequest } from '../h2oProxy/postParseFilesRequest';

export function requestParseFiles(
  _,
  sourceKeys,
  destinationKey,
  parseType,
  separator,
  columnCount,
  useSingleQuotes,
  columnNames,
  columnTypes,
  deleteOnDone,
  checkHeader,
  chunkSize,
  go
) {
  return postParseFilesRequest(_, sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, (error, parseResult) => {
    if (error) {
      return go(error);
    }
    return go(null, extendParseResult(_, parseResult));
  });
}
