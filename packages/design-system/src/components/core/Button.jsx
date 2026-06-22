import React from "react";

/**
 * GoCSM Button — the brand's primary control.
 * Maps to .btn + variant classes in components.css. 36px default height,
 * 28px for sm. Primary uses the blue CTA gradient + inner-gradient shadow
 * (never a halo). The AI variant is reserved for AI-authored actions only.
 */
export function Button({
  variant = "secondary",
  size = "md",
  icon = null,
  iconRight = null,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...rest
}) {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
    ai: "btn-ai",
  }[variant] || "btn-secondary";

  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";

  return (
    <button
      type={type}
      disabled={disabled}
      className={["btn", variantClass, sizeClass, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {icon}
      {children && <span>{children}</span>}
      {iconRight}
    </button>
  );
}
