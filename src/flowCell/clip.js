export default function clip(_, _type, _input) {
  return _.saveClip('user', _type(), _input());
}
