export function error() {
  const Flow = window.Flow;
  const printStackTrace = window.printStackTrace;
  const __hasProp = {}.hasOwnProperty;

  const __extends = (child, parent) => {
    let key;
    for (key in parent) {
      if (__hasProp.call(parent, key)) {
        child[key] = parent[key];
      }
    }
    function Ctor() {
      this.constructor = child;
    }
    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    child.__super__ = parent.prototype;
    return child;
  };

  const FlowError = (_super => {
    __extends(FlowError, _super);
    function FlowError(message, cause) {
      let error;
      const _ref = this.cause;
      this.message = message;
      this.cause = cause;
      this.name = 'FlowError';
      if (typeof this.cause !== 'undefined') {
        if (typeof this.cause.stack !=='undefined') {
          this.stack = this.cause.stack;
        }
      } else {
        error = new Error();
        if (error.stack) {
          this.stack = error.stack;
        } else {
          this.stack = printStackTrace();
        }
      }
    }
    return FlowError;
  })(Error);
  Flow.Error = FlowError;
}
