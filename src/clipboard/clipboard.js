import { getObjectExistsRequest } from '../h2oProxy/getObjectExistsRequest';
import { getObjectRequest } from '../h2oProxy/getObjectRequest';
import { postPutObjectRequest } from '../h2oProxy/postPutObjectRequest';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function clipboard() {
  const lodash = window._;
  const Flow = window.Flow;
  const SystemClips = [
    'assist',
    'importFiles',
    'getFrames',
    'getModels',
    'getPredictions',
    'getJobs',
    'buildModel',
    'predict',
  ];
  Flow.clipboard = _ => {
    const lengthOf = array => {
      if (array.length) {
        return `(${array.length})`;
      }
      return '';
    };
    const _systemClips = Flow.Dataflow.signals([]);
    const _systemClipCount = Flow.Dataflow.lift(_systemClips, lengthOf);
    const _userClips = Flow.Dataflow.signals([]);
    const _userClipCount = Flow.Dataflow.lift(_userClips, lengthOf);
    const _hasUserClips = Flow.Dataflow.lift(_userClips, clips => clips.length > 0);
    const _trashClips = Flow.Dataflow.signals([]);
    const _trashClipCount = Flow.Dataflow.lift(_trashClips, lengthOf);
    const _hasTrashClips = Flow.Dataflow.lift(_trashClips, clips => clips.length > 0);
    const createClip = (_list, _type, _input, _canRemove) => {
      if (_canRemove == null) {
        _canRemove = true;
      }
      const execute = () => _.insertAndExecuteCell(_type, _input);
      const insert = () => _.insertCell(_type, _input);
      flowPrelude.remove = () => {
        if (_canRemove) {
          return removeClip(_list, self);
        }
      };
      const self = {
        type: _type,
        input: _input,
        execute,
        insert,
        remove: flowPrelude.remove,
        canRemove: _canRemove,
      };
      return self;
    };
    const addClip = (list, type, input) => list.push(createClip(list, type, input));
    function removeClip(list, clip) {
      if (list === _userClips) {
        _userClips.remove(clip);
        saveUserClips();
        return _trashClips.push(createClip(_trashClips, clip.type, clip.input));
      }
      return _trashClips.remove(clip);
    }
    const emptyTrash = () => _trashClips.removeAll();
    const loadUserClips = () => getObjectExistsRequest(_, 'environment', 'clips', (error, exists) => {
      if (exists) {
        return getObjectRequest(_, 'environment', 'clips', (error, doc) => {
          if (!error) {
            return _userClips(lodash.map(doc.clips, clip => createClip(_userClips, clip.type, clip.input)));
          }
        });
      }
    });
    const serializeUserClips = () => ({
      version: '1.0.0',

      clips: lodash.map(_userClips(), clip => ({
        type: clip.type,
        input: clip.input,
      })),
    });
    function saveUserClips() {
      return postPutObjectRequest(_, 'environment', 'clips', serializeUserClips(), error => {
        if (error) {
          _.alert(`Error saving clips: ${error.message}`);
        }
      });
    }
    const initialize = () => {
      _systemClips(lodash.map(SystemClips, input => createClip(_systemClips, 'cs', input, false)));
      return Flow.Dataflow.link(_.ready, () => {
        loadUserClips();
        return Flow.Dataflow.link(_.saveClip, (category, type, input) => {
          input = input.trim();
          if (input) {
            if (category === 'user') {
              addClip(_userClips, type, input);
              return saveUserClips();
            }
            return addClip(_trashClips, type, input);
          }
        });
      });
    };
    initialize();
    return {
      systemClips: _systemClips,
      systemClipCount: _systemClipCount,
      userClips: _userClips,
      hasUserClips: _hasUserClips,
      userClipCount: _userClipCount,
      trashClips: _trashClips,
      trashClipCount: _trashClipCount,
      hasTrashClips: _hasTrashClips,
      emptyTrash,
    };
  };
}
