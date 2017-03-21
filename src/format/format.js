export function format() {
  const lodash = window._;
  const Flow = window.Flow;
  const d3 = window.d3;
  let formatTime;
  const significantDigitsBeforeDecimal = value => 1 + Math.floor(Math.log(Math.abs(value)) / Math.LN10);
  const Digits = (digits, value) => {
    if (value === 0) {
      return 0;
    }
    const sd = significantDigitsBeforeDecimal(value);
    if (sd >= digits) {
      return value.toFixed(0);
    }
    const magnitude = Math.pow(10, digits - sd);
    return Math.round(value * magnitude) / magnitude;
  };
  if (typeof exports === 'undefined' || exports === null) {
    formatTime = d3.time.format('%Y-%m-%d %H:%M:%S');
  }
  const formatDate = time => {
    if (time) {
      return formatTime(new Date(time));
    }
    return '-';
  };
  const __formatReal = {};
  const formatReal = precision => {
    const cached = __formatReal[precision];
    //
    // will leave the nested ternary statement commented for now
    // may be useful to confirm later that the translation to an if else block
    // was an accurate translation
    //
    // const format = cached ? cached : __formatReal[precision] = precision === -1 ? lodash.identity : d3.format(`.${precision}f`);
    let format;
    if (cached) {
      format = cached;
    } else {
      __formatReal[precision] = precision;
      // __formatReal[precision] === -1 ? lodash.identity : d3.format(`.${precision}f`);
      if (__formatReal[precision] === -1) {
        format = lodash.identity;
      } else {
        format = d3.format(`.${precision}f`);
      }
    }
    return value => format(value);
  };
  Flow.Format = {
    Digits,
    Real: formatReal,
    Date: formatDate,
    time: formatTime,
  };
}
