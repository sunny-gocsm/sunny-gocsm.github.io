import React from "react";

export function Mono({ children, className = "", style, ...rest }) {
  return (
    <span
      className={className}
      style={{
        fontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

export default Mono;
