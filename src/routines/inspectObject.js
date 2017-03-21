import { format6fi } from './format6fi';
import { inspectRawArray_ } from './inspectRawArray_';
import { inspectObjectArray_ } from './inspectObjectArray_';
import { inspectTwoDimTable_ } from './inspectTwoDimTable_';
import { inspectRawObject_ } from './inspectRawObject_';
import { schemaTransforms } from './schemaTransforms';
import { blacklistedAttributesBySchema } from './blacklistedAttributesBySchema';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function inspectObject(inspections, name, origin, obj) {
  const lodash = window._;
  let k;
  let meta;
  let v;
  let _ref2;
  let schemaType;
  if (typeof obj !== 'undefined') {
    if (typeof obj.__meta !== 'undefined') {
      schemaType = obj.__meta.schema_type;
    }
  }
  const attrs = blacklistedAttributesBySchema()[schemaType];
  console.log('attrs from inspectObject', attrs);
  let blacklistedAttributes = { __meta: true };
  if (schemaType && typeof attrs !== 'undefined') {
    blacklistedAttributes = attrs;
  }
  const transform = schemaTransforms[schemaType];
  if (transform) {
    obj = transform(obj);
  }
  const record = {};
  inspections[name] = inspectRawObject_(name, origin, name, record);
  for (k in obj) {
    if ({}.hasOwnProperty.call(obj, k) && typeof obj !== 'undefined') {
      console.log('k from inspectObject', k);
      console.log('obj from inspectObject', obj);
      console.log('blacklistedAttributes from inspectObject', blacklistedAttributes);
      v = obj[k];
      if (!blacklistedAttributes[k]) {
        if (v === null) {
          record[k] = null;
        } else {
          console.log('v from inspectObject', v);
          _ref2 = v.__meta;
          if ((_ref2 != null ? _ref2.schema_type : void 0) === 'TwoDimTable') {
            inspections[`${name} - ${v.name}`] = inspectTwoDimTable_(origin, `${name} - ${v.name}`, v);
          } else {
            if (lodash.isArray(v)) {
              if (k === 'cross_validation_models' || k === 'cross_validation_predictions' || name === 'output' && (k === 'weights' || k === 'biases')) {
                inspections[k] = inspectObjectArray_(k, origin, k, v);
              } else {
                inspections[k] = inspectRawArray_(k, origin, k, v);
              }
            } else if (lodash.isObject(v)) {
              console.log('v from inspectObject', v);
              meta = v.__meta;
              if (meta) {
                if (meta.schema_type === 'Key<Frame>') {
                  record[k] = `<a href=\'#\' data-type=\'frame\' data-key=${flowPrelude.stringify(v.name)}>${lodash.escape(v.name)}</a>`;
                } else if (meta.schema_type === 'Key<Model>') {
                  record[k] = `<a href=\'#\' data-type=\'model\' data-key=${flowPrelude.stringify(v.name)}>${lodash.escape(v.name)}</a>`;
                } else if (meta.schema_type === 'Frame') {
                  record[k] = `<a href=\'#\' data-type=\'frame\' data-key=${flowPrelude.stringify(v.frame_id.name)}>${lodash.escape(v.frame_id.name)}</a>`;
                } else {
                  inspectObject(inspections, `${name} - ${k}`, origin, v);
                }
              } else {
                console.log(`WARNING: dropping [${k}] from inspection:`, v);
              }
            } else {
              record[k] = lodash.isNumber(v) ? format6fi(v) : v;
            }
          }
        }
      }
    }
  }
}
