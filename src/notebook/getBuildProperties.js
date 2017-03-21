import findBuildProperty from './findBuildProperty';

export default function getBuildProperties() {
  const lodash = window._;
  const projectVersion = findBuildProperty('H2O Build project version');
  return [
    findBuildProperty('H2O Build git branch'),
    projectVersion,
    projectVersion ? lodash.last(projectVersion.split('.')) : void 0,
    findBuildProperty('H2O Build git hash') || 'master',
  ];
}
