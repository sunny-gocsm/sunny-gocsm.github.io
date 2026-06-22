import React from "react";
/** Mono — wraps any number/count/currency in JetBrains Mono tabular figures (.mono). */
export function Mono({ children, className = "", ...rest }) {
  return <span className={["mono", className].filter(Boolean).join(" ")} {...rest}>{children}</span>;
}
