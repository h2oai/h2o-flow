export default function executeCommand(_, command) {
  return () => _.insertAndExecuteCell('cs', command);
}
