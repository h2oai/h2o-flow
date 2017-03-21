export default function select(_, self) {
  // tied to mouse-clicks on the cell

  // pass scrollIntoView=false,
  // otherwise mouse actions like clicking on a form field will cause scrolling.
  _.selectCell(self, false);
  // Explicitly return true, otherwise ko will prevent the mouseclick event from bubbling up
  return true;
}
