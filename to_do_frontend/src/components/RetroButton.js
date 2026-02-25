import React from "react";
import "./RetroButton.css";

// PUBLIC_INTERFACE
export default function RetroButton({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
  ariaLabel,
}) {
  /** Retro-styled button. */
  const className = `RetroButton RetroButton--${variant} RetroButton--${size}`;

  return (
    <button
      className={className}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="RetroButton__inner">{children}</span>
    </button>
  );
}
