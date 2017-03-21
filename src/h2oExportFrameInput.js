import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oExportFrameInput(_, _go, frameKey, path, opt) {
  const lodash = window._;
  const Flow = window.Flow;
  const _frames = Flow.Dataflow.signal([]);
  const _selectedFrame = Flow.Dataflow.signal(frameKey);
  const _path = Flow.Dataflow.signal(null);
  const _overwrite = Flow.Dataflow.signal(true);
  const _canExportFrame = Flow.Dataflow.lift(_selectedFrame, _path, (frame, path) => frame && path);
  const exportFrame = () => _.insertAndExecuteCell('cs', `exportFrame ${flowPrelude.stringify(_selectedFrame())}, ${flowPrelude.stringify(_path())}, overwrite: ${(_overwrite() ? 'true' : 'false')}`);
  _.requestFrames(_, (error, frames) => {
    let frame;
    if (error) {
      // empty
    } else {
      _frames((() => {
        let _i;
        let _len;
        const _results = [];
        for (_i = 0, _len = frames.length; _i < _len; _i++) {
          frame = frames[_i];
          _results.push(frame.frame_id.name);
        }
        return _results;
      })());
      return _selectedFrame(frameKey);
    }
  });
  lodash.defer(_go);
  return {
    frames: _frames,
    selectedFrame: _selectedFrame,
    path: _path,
    overwrite: _overwrite,
    canExportFrame: _canExportFrame,
    exportFrame,
    template: 'flow-export-frame-input',
  };
}

