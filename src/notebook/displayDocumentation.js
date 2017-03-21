import getBuildProperties from './getBuildProperties';

export default function displayDocumentation() {
  const _ref = getBuildProperties();
  const gitBranch = _ref[0];
  const projectVersion = _ref[1];
  const buildVersion = _ref[2];
  const gitHash = _ref[3];
  if (buildVersion && buildVersion !== '99999') {
    return window.open(`http://h2o-release.s3.amazonaws.com/h2o/${gitBranch}/${buildVersion}/docs-website/h2o-docs/index.html`, '_blank');
  }
  return window.open(`https://github.com/h2oai/h2o-3/blob/${gitHash}/h2o-docs/src/product/flow/README.md`, '_blank');
}
