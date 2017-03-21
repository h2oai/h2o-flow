import { createTextboxControl } from './createTextboxControl';
import { createDropdownControl } from './createDropdownControl';
import { createListControl } from './createListControl/createListControl';
import { createCheckboxControl } from './createCheckboxControl';

export function createControlFromParameter(parameter) {
  switch (parameter.type) {
    case 'enum':
    case 'Key<Frame>':
    case 'VecSpecifier':
      return createDropdownControl(parameter);
    case 'string[]':
    case 'Key<Frame>[]':
    case 'Key<Model>[]':
      return createListControl(parameter);
    case 'boolean':
      return createCheckboxControl(parameter);
    case 'Key<Model>':
    case 'string':
    case 'byte':
    case 'short':
    case 'int':
    case 'long':
    case 'float':
    case 'double':
    case 'byte[]':
    case 'short[]':
    case 'int[]':
    case 'long[]':
    case 'float[]':
    case 'double[]':
      return createTextboxControl(parameter, parameter.type);
    default:
      console.error('Invalid field', JSON.stringify(parameter, null, 2));
      return null;
  }
}
