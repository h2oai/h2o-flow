import { doPost } from './doPost';
import { encodeArrayForPost } from './encodeArrayForPost';

export function postParseSetupPreviewRequest(
  _,
  sourceKeys,
  parseType,
  separator,
  useSingleQuotes,
  checkHeader,
  columnTypes,
  go
) {
  const opts = {
    source_frames: encodeArrayForPost(sourceKeys),
    parse_type: parseType,
    separator,
    single_quotes: useSingleQuotes,
    check_header: checkHeader,
    column_types: encodeArrayForPost(columnTypes),
  };
  return doPost(_, '/3/ParseSetup', opts, go);
}
