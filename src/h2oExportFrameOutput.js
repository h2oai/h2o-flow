export function h2oExportFrameOutput(_, _go, result) {
  const lodash = window._;
  lodash.defer(_go);
  return { template: 'flow-export-frame-output' };
}

