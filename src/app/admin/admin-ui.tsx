"use client";

import { useState, type ReactNode } from "react";

/** Small building blocks for the admin page. */

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-[15px] text-fg outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15";
const areaClass =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[15px] leading-relaxed text-fg outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15";
export const ghostButton =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 text-sm font-medium text-fg transition hover:bg-surface2 disabled:pointer-events-none disabled:opacity-40";
export const primaryButton =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-btn px-4 text-sm font-medium text-btn-fg transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-40";

// ---------------------------------------------------------------------------
// Icons (24 × 24, drawn with strokes)

const PATHS = {
  look: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-1.9 2-1.9h2.1A4.1 4.1 0 0 0 21 10.6C21 6.4 17 3 12 3Z" />
      <circle cx="7.5" cy="11.5" r="1" />
      <circle cx="10" cy="7.5" r="1" />
      <circle cx="15" cy="7.5" r="1" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c.8-3.6 3.8-5.6 7.5-5.6s6.7 2 7.5 5.6" />
    </>
  ),
  work: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9h18M7 6.8h.01M10 6.8h.01" />
    </>
  ),
  experience: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V7M3 12.5h18" />
    </>
  ),
  links: (
    <>
      <path d="M10 14a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1.2 1.2" />
      <path d="M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1.2-1.2" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  external: <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.6A8.2 8.2 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6Z" />,
  device: <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1ZM8.5 20.5h7M12 17v3.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  file: <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM14 3v5h5M9.5 13h5M9.5 16.5h5" />,
  upload: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  logout: <path d="M14.5 4H18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3.5M10 16.5 5.5 12 10 7.5M5.5 12H15" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Layout

export function Card(props: { title: string; badge?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          {props.title}
          {props.badge && (
            <span className="rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-link">
              {props.badge}
            </span>
          )}
        </h2>
        {props.aside}
      </header>
      <div className="flex flex-col gap-4 p-5">{props.children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Fields

function Label({ text, hint, length, max }: { text: string; hint?: string; length: number; max: number }) {
  const near = length > max * 0.8;
  return (
    <span className="flex items-baseline justify-between gap-3">
      <span className="text-[13px] font-medium text-fg">{text}</span>
      {near ? (
        <span className={`font-mono text-[11px] ${length >= max ? "text-danger" : "text-muted"}`}>
          {length}/{max}
        </span>
      ) : (
        hint && <span className="truncate text-xs text-muted">{hint}</span>
      )}
    </span>
  );
}

export function Text(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  hint?: string;
  placeholder?: string;
  type?: "text" | "email";
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <Label text={props.label} hint={props.hint} length={props.value.length} max={props.max} />
      <input
        type={props.type ?? "text"}
        value={props.value}
        maxLength={props.max}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

export function Area(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  rows: number;
  hint?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <Label text={props.label} hint={props.hint} length={props.value.length} max={props.max} />
      <textarea
        value={props.value}
        rows={props.rows}
        maxLength={props.max}
        onChange={(e) => props.onChange(e.target.value)}
        className={areaClass}
      />
    </label>
  );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-medium text-fg">{label}</span>
      <span className="flex h-11 items-center gap-2 rounded-xl border border-line bg-bg pl-1.5 pr-3 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
        <span className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-line" style={{ background: valid ? value : "transparent" }}>
          <input
            type="color"
            value={valid ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label}: pick a colour`}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </span>
        <input
          value={value}
          maxLength={7}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase text-fg outline-none"
        />
      </span>
    </label>
  );
}

const splitList = (text: string) =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** A comma-separated list that keeps exactly what you typed while you type it. */
export function ListInput(props: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState(props.value.join(", "));
  const [seen, setSeen] = useState(props.value);
  if (seen !== props.value) {
    setSeen(props.value);
    if (splitList(text).join("\u0000") !== props.value.join("\u0000")) setText(props.value.join(", "));
  }
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-fg">{props.label}</span>
        <span className="text-xs text-muted">Separate with commas</span>
      </span>
      <input
        value={text}
        placeholder={props.placeholder}
        onChange={(e) => {
          setText(e.target.value);
          props.onChange(splitList(e.target.value));
        }}
        className={inputClass}
      />
    </label>
  );
}

export function Select<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-medium text-fg">{props.label}</span>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value as T)} className={`${inputClass} pr-8`}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A slider with its current value shown next to the label. */
export function Range(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-fg">{props.label}</span>
        <span className="font-mono text-xs text-muted">{props.format(props.value)}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-accent"
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Choices

export function Segmented<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string; icon: IconName }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={props.label} className="grid grid-flow-col gap-1 rounded-xl bg-surface2 p-1">
      {props.options.map((o) => {
        const on = o.value === props.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => props.onChange(o.value)}
            className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${
              on ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-muted hover:text-fg"
            }`}
          >
            <Icon name={o.icon} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle(props: { label: string; note?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      onClick={() => props.onChange(!props.checked)}
      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-3.5 py-3 text-left transition hover:border-muted/40"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{props.label}</span>
        {props.note && <span className="block text-xs text-muted">{props.note}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-10 shrink-0 rounded-full transition ${props.checked ? "bg-accent" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${props.checked ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Lists

function IconButton(props: { label: string; icon: IconName; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-muted transition hover:text-fg disabled:opacity-30"
    >
      <Icon name={props.icon} />
    </button>
  );
}

/**
 * A list shown as compact rows. Click a row to edit it in place; only one row
 * is open at a time.
 */
export function ListEditor<T>(props: {
  items: T[];
  max: number;
  noun: string;
  blank: () => T;
  title: (item: T) => string;
  subtitle?: (item: T) => string;
  dot?: (item: T) => string;
  onChange: (items: T[]) => void;
  render: (item: T, patch: (change: Partial<T>) => void) => ReactNode;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    const next = [...props.items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    props.onChange(next);
    setOpen(to);
  };

  return (
    <div className="flex flex-col gap-3">
      {props.items.length > 0 && (
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {props.items.map((item, i) => {
            const isOpen = open === i;
            const title = props.title(item).trim();
            const subtitle = props.subtitle?.(item).trim();
            return (
              <div key={i} className={isOpen ? "bg-bg" : undefined}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-surface2"
                >
                  {props.dot && (
                    <span className="size-3 shrink-0 rounded-full ring-1 ring-line" style={{ background: props.dot(item) }} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-medium ${title ? "" : "text-muted"}`}>
                      {title || `New ${props.noun}`}
                    </span>
                    {subtitle && <span className="block truncate text-xs text-muted">{subtitle}</span>}
                  </span>
                  <Icon name="chevron" className={`size-4 shrink-0 text-muted transition ${isOpen ? "rotate-90" : ""}`} />
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-4 border-t border-line px-3.5 pb-4 pt-4">
                    {props.render(item, (change) =>
                      props.onChange(props.items.map((it, j) => (j === i ? { ...it, ...change } : it))),
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        <IconButton label="Move up" icon="up" disabled={i === 0} onClick={() => move(i, i - 1)} />
                        <IconButton
                          label="Move down"
                          icon="down"
                          disabled={i === props.items.length - 1}
                          onClick={() => move(i, i + 1)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          props.onChange(props.items.filter((_, j) => j !== i));
                          setOpen(null);
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-danger transition hover:bg-danger/10"
                      >
                        <Icon name="trash" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {props.items.length < props.max ? (
        <button
          type="button"
          onClick={() => {
            props.onChange([...props.items, props.blank()]);
            setOpen(props.items.length);
          }}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-medium text-muted transition hover:border-accent hover:text-fg"
        >
          <Icon name="plus" />
          Add {props.noun}
        </button>
      ) : (
        <p className="text-center text-xs text-muted">Full: {props.max} is the most this list can hold.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helpers

/** Shown in the viewer's own time zone, which the server can't know, hence the warning opt-out. */
export function LocalTime({ iso, dateOnly }: { iso: string; dateOnly?: boolean }) {
  const d = new Date(iso);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {dateOnly
        ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
        : d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
    </time>
  );
}

export function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
