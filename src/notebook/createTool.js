export default function createTool(icon, label, action, isDisabled) {
  if (isDisabled == null) {
    isDisabled = false;
  }
  return {
    label,
    action,
    isDisabled,
    icon: `fa fa-${icon}`,
  };
}
