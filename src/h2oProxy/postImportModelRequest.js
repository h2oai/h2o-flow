import { doPost } from './doPost';

export function postImportModelRequest(_, path, overwrite, go) {
  const opts = {
    dir: path,
    force: overwrite,
  };
  return doPost(_, '/99/Models.bin/not_in_use', opts, go);
}
