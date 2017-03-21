export default function navigate(_, self) {
  // tied to mouse-clicks in the outline view
  _.selectCell(self);

  // Explicitly return true, otherwise ko will prevent the mouseclick event from bubbling up
  return true;
}
