import { doPost } from './doPost';
import { encodeArrayForPost } from './encodeArrayForPost';

export function postParseFilesRequest(
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
  const opts = {
    destination_frame: destinationKey,
    source_frames: encodeArrayForPost(sourceKeys),
    parse_type: parseType,
    separator,
    number_columns: columnCount,
    single_quotes: useSingleQuotes,
    column_names: encodeArrayForPost(columnNames),
    column_types: encodeArrayForPost(columnTypes),
    check_header: checkHeader,
    delete_on_done: deleteOnDone,
    chunk_size: chunkSize,
  };
  return doPost(_, '/3/Parse', opts, go);
}
