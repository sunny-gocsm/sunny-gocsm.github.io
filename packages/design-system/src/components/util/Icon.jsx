import React from "react";
import { icons } from "lucide-react";

const toPascal = (n) =>
  String(n || "").split(/[-_]/).filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");

// kebab -> kebab aliases for icons Lucide has since renamed (keeps our names stable across versions)
const ALIAS = {
  "alert-triangle": "triangle-alert",
  "alert-circle": "circle-alert",
  "help-circle": "circle-question-mark",
  "check-circle": "circle-check",
  "more-horizontal": "ellipsis",
};

/**
 * Renders a Lucide icon by its kebab-case name, e.g. name="alert-triangle".
 * Replaces the static data-lucide convention with real React-rendered SVGs so icons render (and
 * re-render) correctly in React / Lovable. Forwards size, color, strokeWidth, className, style.
 * Unknown names render nothing rather than throwing.
 */
export function Icon({ name, ...rest }) {
  const Glyph = icons[toPascal(name)] || icons[toPascal(ALIAS[name])];
  return Glyph ? <Glyph {...rest} /> : null;
}
