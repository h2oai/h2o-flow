import { doGet } from './doGet';

export function requestFrames(_, go) {
  return doGet(_, '/3/Frames', (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, result.frames);
  });
}
