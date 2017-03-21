import { requestWithOpts } from './requestWithOpts';

export function requestFileGlob(_, path, limit, go) {
  const opts = {
    src: encodeURIComponent(path),
    limit,
  };
  return requestWithOpts(_, '/3/Typeahead/files', opts, go);
}
