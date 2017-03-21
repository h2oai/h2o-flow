export function safetyWrapCoffeescript(guid) {
  const lodash = window._;
  return (cs, go) => {
    const lines = cs
      .replace(/[\n\r]/g, '\n') // normalize CR/LF
      .split('\n'); // split into lines

    // indent once
    const block = lodash.map(lines, line => `  ${line}`);

    // enclose in execute-immediate closure
    block.unshift(`_h2o_results_[\'${guid}\'].result do ->`);

    // join and proceed
    return go(null, block.join('\n'));
  };
}
