import React from "react";
import * as Lucide from "lucide-react";

// kebab-case → PascalCase
function toPascal(name) {
  return String(name || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function Icon({ name, size = 16, className = "", style, ...rest }) {
  const key = toPascal(name);
  const Cmp = Lucide[key] || Lucide.Circle;
  return (
    <Cmp
      size={size}
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export default Icon;
