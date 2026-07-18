import { shortcutParts } from "../core/shortcuts";

export default function ShortcutKeys({ shortcut, platform, small = false }) {
  return (
    <span className={`sl-shortcut-keys ${small ? "is-small" : ""}`} aria-label={shortcutParts(shortcut, platform).join(" plus ")}>
      {shortcutParts(shortcut, platform).map((part) => <kbd key={part}>{part}</kbd>)}
    </span>
  );
}
