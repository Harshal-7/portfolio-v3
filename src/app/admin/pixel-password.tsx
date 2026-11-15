"use client";

import "./admin.css";

export type PasswordStatus = "idle" | "checking" | "error" | "ok";

const MAX_DOTS = 24;

/**
 * A password field that shows each typed character as a small glowing pixel.
 * The real <input type="password"> covers the field invisibly, so typing,
 * pasting, password managers and screen readers all work as normal.
 */
export function PixelPassword(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  status: PasswordStatus;
  name?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  /** Changing this replays the shake after a wrong password. */
  shakeKey?: number;
}) {
  const shown = Math.min(props.value.length, MAX_DOTS);
  return (
    <div key={props.shakeKey} className="pp-field" data-status={props.status}>
      <input
        type="password"
        name={props.name}
        aria-label={props.label}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoFocus={props.autoFocus}
        autoComplete={props.autoComplete ?? "current-password"}
        spellCheck={false}
        className="pp-input"
      />
      <span aria-hidden="true" className="pp-slots">
        {Array.from({ length: shown }, (_, i) => (
          <span
            key={i}
            className="pp-dot"
            style={props.status === "checking" ? { animationDelay: `${(i % 12) * 0.06}s` } : undefined}
          />
        ))}
        {props.value.length > MAX_DOTS && <span className="pp-more">+{props.value.length - MAX_DOTS}</span>}
        {props.status !== "checking" && props.status !== "ok" && <span className="pp-caret" />}
      </span>
      <span aria-hidden="true" className="pp-hint">
        {props.value ? "Enter ↵" : "Type"}
      </span>
    </div>
  );
}
