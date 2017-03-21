import { flowHeading } from '../flowHeading';
import { flowMarkdown } from '../flowMarkdown';
import { flowCoffeescript } from '../flowCoffeescript/flowCoffeescript';
import { flowRaw } from '../flowRaw';

export function flowRenderers(_, _sandbox) {
  return {
    h1() {
      return flowHeading(_, 'h1');
    },

    h2() {
      return flowHeading(_, 'h2');
    },

    h3() {
      return flowHeading(_, 'h3');
    },

    h4() {
      return flowHeading(_, 'h4');
    },

    h5() {
      return flowHeading(_, 'h5');
    },

    h6() {
      return flowHeading(_, 'h6');
    },

    md() {
      return flowMarkdown(_);
    },

    cs(guid) {
      return flowCoffeescript(_, guid, _sandbox);
    },

    sca(guid) {
      return flowCoffeescript(_, guid, _sandbox);
    },

    raw() {
      return flowRaw(_);
    },
  };
}
