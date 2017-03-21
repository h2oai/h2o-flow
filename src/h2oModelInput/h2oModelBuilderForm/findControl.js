export function findControl(name, _controlGroups, control) {
  let controls;
  let _l;
  let _len3;
  let _len4;
  let _m;
  for (_l = 0, _len3 = _controlGroups.length; _l < _len3; _l++) {
    controls = _controlGroups[_l];
    for (_m = 0, _len4 = controls.length; _m < _len4; _m++) {
      control = controls[_m];
      if (control.name === name) {
        return control;
      }
    }
  }
}
