"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";

import {
  contentOf,
  contentSchema,
  issueText,
  SECTION_KEYS,
  type DefaultMode,
  type Design,
  type ImageKey,
  type Resume,
  type SectionKey,
  type SiteContent,
  type SiteDoc,
} from "@/lib/site/schema";

import {
  finishResumeUpload,
  logout,
  removeResume,
  saveContent,
  savingStatus,
  undoLastSave,
  unlockSaving,
  type SaveResult,
} from "./actions";

type Status = { kind: "ok" | "error"; text: string; issues?: string[] } | null;

const DESIGN_OPTIONS: { value: Design; name: string; about: string }[] = [
  { value: "notebook", name: "Notebook", about: "Fraunces and Inter, paper grain, pull-cord bulb, big project tiles." },
  { value: "pixel", name: "Pixel", about: "Pixel font, sparkles, LED ticker, pixel bulb and pixel cards." },
];

const MODE_OPTIONS: { value: DefaultMode; label: string }[] = [
  { value: "system", label: "Follow the visitor’s device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const SECTION_LABELS: Record<SectionKey, string> = {
  projects: "Projects",
  earlier: "Earlier work (Side quests in Pixel)",
  about: "About",
  experience: "Experience",
  stack: "Stack (Inventory in Pixel)",
  contact: "Say hi",
};

const IMAGE_OPTIONS: { value: ImageKey; label: string }[] = [
  { value: "evenor", label: "Evenor phone screenshots" },
  { value: "life-vault", label: "Life Vault screenshot" },
  { value: "none", label: "No image (brand colour only)" },
];

export function AdminPanel(props: {
  initial: SiteDoc;
  initialCanUndo: boolean;
  storeReady: boolean;
  blobReady: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(props.initial);
  const [draft, setDraft] = useState<SiteContent>(() => contentOf(props.initial));
  const [canUndo, setCanUndo] = useState(props.initialCanUndo);
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(contentOf(saved)), [draft, saved]);
  const [askingPassword, setAskingPassword] = useState(false);
  const answer = useRef<((unlocked: boolean) => void) | null>(null);

  /** Opens the save-password dialog; resolves true once saving is unlocked. */
  function askForSavePassword(): Promise<boolean> {
    return new Promise((resolve) => {
      answer.current = resolve;
      setAskingPassword(true);
    });
  }

  async function ensureUnlocked(): Promise<boolean> {
    const { unlocked } = await savingStatus();
    return unlocked || askForSavePassword();
  }

  /** Runs a change, asking for the save password first when needed (and again if it ran out meanwhile). */
  async function runChange(change: () => Promise<SaveResult>): Promise<SaveResult | null> {
    if (!(await ensureUnlocked())) return null;
    let result = await change();
    if (!result.ok && result.locked) {
      if (!(await askForSavePassword())) return null;
      result = await change();
    }
    return result;
  }

  const notSaved = () => setStatus({ kind: "error", text: "Not saved. Changes need the save password." });

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** keepDraft: résumé changes save on their own and must not throw away unsaved text edits. */
  function apply(result: SaveResult, okText: string, keepDraft = false) {
    if (result.ok) {
      setSaved(result.doc);
      if (!keepDraft) setDraft(contentOf(result.doc));
      setCanUndo(result.canUndo);
      setStatus({ kind: "ok", text: okText });
    } else {
      setStatus({ kind: "error", text: result.error, issues: result.issues });
    }
  }

  function save() {
    const check = contentSchema.safeParse(draft);
    if (!check.success) {
      setStatus({
        kind: "error",
        text: "Some fields need fixing before this can be saved.",
        issues: check.error.issues.slice(0, 8).map(issueText),
      });
      return;
    }
    startTransition(async () => {
      const result = await runChange(() => saveContent(saved.rev, draft));
      if (result) apply(result, "Saved. The site shows the change now.");
      else notSaved();
    });
  }

  function undo() {
    const note = dirty ? " Your unsaved edits on this page will be lost too." : "";
    if (!window.confirm(`Go back to the version before your last save?${note}`)) return;
    startTransition(async () => {
      const result = await runChange(() => undoLastSave(saved.rev));
      if (result) apply(result, "Undone. The site is back to the previous version.");
      else notSaved();
    });
  }

  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setProfile = (key: keyof SiteContent["profile"], value: string) =>
    setDraft((d) => ({ ...d, profile: { ...d.profile, [key]: value } }));
  const setPixel = (key: keyof SiteContent["pixel"], value: string) =>
    setDraft((d) => ({ ...d, pixel: { ...d.pixel, [key]: value } }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Site admin</h1>
          <p className="text-sm text-muted">
            Last saved <LocalTime iso={saved.updatedAt} /> · version {saved.rev}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" rel="noreferrer" className={ghostButton}>
            View site ↗
          </a>
          <form
            action={async () => {
              await logout();
              router.refresh();
            }}
          >
            <button type="submit" className={ghostButton}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      {!props.storeReady && (
        <Banner>Storage isn’t connected, so saving won’t work yet. Connect Upstash Redis in Vercel → Storage.</Banner>
      )}

      <Card title="Look" hint="Applies to every visitor as soon as you save.">
        <fieldset className="flex flex-col gap-2">
          <legend className={labelText}>Design</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {DESIGN_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 ${
                  draft.design === o.value ? "border-accent bg-accent-soft" : "border-line"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="design"
                    checked={draft.design === o.value}
                    onChange={() => set("design", o.value)}
                    className="accent-accent"
                  />
                  <span className="font-medium">{o.name}</span>
                  <a
                    href={`/admin/preview/${o.value}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-sm text-link underline underline-offset-2"
                  >
                    Preview ↗
                  </a>
                </span>
                <span className="text-sm text-muted">{o.about}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">Previews show the last saved text in that design.</p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={labelText}>Theme for first-time visitors</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {MODE_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={draft.defaultMode === o.value}
                  onChange={() => set("defaultMode", o.value)}
                  className="accent-accent"
                />
                {o.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">Once a visitor presses the bulb, their own choice wins on that device.</p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={labelText}>Sections to show</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SECTION_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.sections[key]}
                  onChange={(e) => set("sections", { ...draft.sections, [key]: e.target.checked })}
                  className="size-4 accent-accent"
                />
                {SECTION_LABELS[key]}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card title="About you">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Name" value={draft.profile.name} max={60} onChange={(v) => setProfile("name", v)} />
          <Text label="Role" value={draft.profile.role} max={60} onChange={(v) => setProfile("role", v)} />
        </div>
        <Area label="Headline (Notebook)" rows={2} value={draft.profile.headline} max={160} onChange={(v) => setProfile("headline", v)} />
        <Area label="Intro (Notebook)" rows={3} value={draft.profile.intro} max={400} onChange={(v) => setProfile("intro", v)} />
        <Text
          label="Now line (Notebook)"
          hint="Project names in this line link to the projects section."
          value={draft.profile.now}
          max={120}
          onChange={(v) => setProfile("now", v)}
        />
        <Area
          label="About"
          hint="Leave a blank line between paragraphs."
          rows={6}
          value={draft.profile.about}
          max={1200}
          onChange={(v) => setProfile("about", v)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Email" type="email" value={draft.profile.email} max={120} onChange={(v) => setProfile("email", v)} />
        </div>
        <Area
          label="Say hi text"
          hint="In Pixel, the first sentence is shown large."
          rows={2}
          value={draft.profile.contactLine}
          max={200}
          onChange={(v) => setProfile("contactLine", v)}
        />
      </Card>

      <Card title="Pixel design text">
        <Text label="Greeting" value={draft.pixel.greeting} max={60} onChange={(v) => setPixel("greeting", v)} />
        <Area label="Intro" rows={3} value={draft.pixel.intro} max={300} onChange={(v) => setPixel("intro", v)} />
        <Text label="LED ticker" value={draft.pixel.ticker} max={160} onChange={(v) => setPixel("ticker", v)} />
      </Card>

      <Card title="Links" hint="Shown as buttons under the intro. Use https:// links, mailto: or /resume.">
        <ListEditor
          items={draft.links}
          max={8}
          noun="link"
          blank={() => ({ label: "", href: "https://" })}
          summary={(l) => l.label || "New link"}
          onChange={(items) => set("links", items)}
          render={(l, patch) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Label" value={l.label} max={30} onChange={(v) => patch({ label: v })} />
              <Text label="Link" value={l.href} max={500} onChange={(v) => patch({ href: v })} />
            </div>
          )}
        />
      </Card>

      <Card title="Projects">
        <ListEditor
          items={draft.projects}
          max={6}
          noun="project"
          blank={() => ({
            name: "",
            tag: "",
            one: "",
            stack: [],
            status: "Live",
            liveHref: "",
            codeHref: "",
            imageKey: "none" as const,
            brand: "#4f46e5",
            bezel: "#18181b",
          })}
          summary={(p) => p.name || "New project"}
          onChange={(items) => set("projects", items)}
          render={(p, patch) => (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Name" value={p.name} max={40} onChange={(v) => patch({ name: v })} />
                <Text label="Status (Pixel badge)" value={p.status} max={16} onChange={(v) => patch({ status: v })} />
              </div>
              <Text label="Tagline" value={p.tag} max={80} onChange={(v) => patch({ tag: v })} />
              <Area label="One-line description" rows={2} value={p.one} max={400} onChange={(v) => patch({ one: v })} />
              <ListInput label="Stack" hint="Separate with commas." value={p.stack} onChange={(v) => patch({ stack: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Live link" value={p.liveHref} max={500} onChange={(v) => patch({ liveHref: v })} />
                <Text label="Source link" value={p.codeHref} max={500} onChange={(v) => patch({ codeHref: v })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className={labelText}>Picture</span>
                  <select
                    value={p.imageKey}
                    onChange={(e) => patch({ imageKey: e.target.value as ImageKey })}
                    className={inputClass}
                  >
                    {IMAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <ColorInput label="Brand colour" value={p.brand} onChange={(v) => patch({ brand: v })} />
                <ColorInput label="Phone frame colour" value={p.bezel} onChange={(v) => patch({ bezel: v })} />
              </div>
            </>
          )}
        />
      </Card>

      <Card title="Earlier work">
        <ListEditor
          items={draft.earlier}
          max={10}
          noun="item"
          blank={() => ({ name: "", what: "", meta: "", href: "" })}
          summary={(e) => e.name || "New item"}
          onChange={(items) => set("earlier", items)}
          render={(e, patch) => (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Name" value={e.name} max={60} onChange={(v) => patch({ name: v })} />
                <Text label="Small note" hint="Shown on the right, e.g. Freelance." value={e.meta} max={40} onChange={(v) => patch({ meta: v })} />
              </div>
              <Text label="What it is" value={e.what} max={200} onChange={(v) => patch({ what: v })} />
              <Text label="Link (optional)" value={e.href} max={500} onChange={(v) => patch({ href: v })} />
            </>
          )}
        />
      </Card>

      <Card title="Experience">
        <ListEditor
          items={draft.experience}
          max={10}
          noun="role"
          blank={() => ({ org: "", role: "", when: "", what: "" })}
          summary={(x) => x.org || "New role"}
          onChange={(items) => set("experience", items)}
          render={(x, patch) => (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Company or school" value={x.org} max={60} onChange={(v) => patch({ org: v })} />
                <Text label="Role" value={x.role} max={80} onChange={(v) => patch({ role: v })} />
              </div>
              <Text label="When" hint="For example: Mar 2024 – now" value={x.when} max={40} onChange={(v) => patch({ when: v })} />
              <Area label="One line on the work (optional)" rows={2} value={x.what} max={300} onChange={(v) => patch({ what: v })} />
            </>
          )}
        />
      </Card>

      <Card title="Stack">
        <ListEditor
          items={draft.stack}
          max={8}
          noun="row"
          blank={() => ({ k: "", v: "" })}
          summary={(r) => r.k || "New row"}
          onChange={(items) => set("stack", items)}
          render={(r, patch) => (
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <Text label="Group" value={r.k} max={20} onChange={(v) => patch({ k: v })} />
              <Text label="Tools" value={r.v} max={160} onChange={(v) => patch({ v })} />
            </div>
          )}
        />
      </Card>

      <ResumeCard
        resume={saved.resume}
        rev={saved.rev}
        blobReady={props.blobReady}
        busy={pending}
        onResult={(result, okText) => apply(result, okText, true)}
        ensureUnlocked={ensureUnlocked}
        onRemove={() => {
          if (!window.confirm("Remove the résumé? /resume will show a “coming soon” note until you upload a new one.")) return;
          startTransition(async () => {
            const result = await runChange(() => removeResume(saved.rev));
            if (result) apply(result, "Résumé removed.", true);
            else notSaved();
          });
        }}
      />

      <SavePasswordDialog
        open={askingPassword}
        onDone={(unlocked) => {
          setAskingPassword(false);
          answer.current?.(unlocked);
          answer.current = null;
        }}
      />

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 basis-full text-sm sm:basis-auto sm:flex-1" aria-live="polite">
            {status ? (
              <div className={status.kind === "error" ? "text-danger" : "text-fg"}>
                <p>{status.text}</p>
                {status.issues && (
                  <ul className="mt-1 list-disc pl-5 text-xs">
                    {status.issues.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-muted">{dirty ? "You have unsaved changes." : "Everything is saved."}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <button type="button" onClick={() => setDraft(contentOf(saved))} disabled={pending} className={ghostButton}>
                Discard
              </button>
            )}
            <button type="button" onClick={undo} disabled={pending || !canUndo} className={ghostButton}>
              Undo last save
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending || !dirty}
              className="h-10 rounded-xl bg-btn px-4 font-medium text-btn-fg disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const labelText = "text-sm font-medium";
const inputClass =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-fg outline-none focus:border-accent";
const ghostButton =
  "inline-flex h-10 items-center rounded-xl border border-line bg-surface px-3 text-sm disabled:opacity-50";

function Banner({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-danger/40 bg-surface p-3 text-sm text-danger">{children}</div>;
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Text(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  hint?: string;
  type?: "text" | "email";
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelText}>{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        maxLength={props.max}
        onChange={(e) => props.onChange(e.target.value)}
        className={inputClass}
      />
      {props.hint && <span className="text-xs text-muted">{props.hint}</span>}
    </label>
  );
}

function Area(props: { label: string; value: string; onChange: (value: string) => void; max: number; rows: number; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelText}>{props.label}</span>
      <textarea
        value={props.value}
        rows={props.rows}
        maxLength={props.max}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 leading-relaxed text-fg outline-none focus:border-accent"
      />
      {props.hint && <span className="text-xs text-muted">{props.hint}</span>}
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelText}>{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
        />
        <input value={value} maxLength={7} onChange={(e) => onChange(e.target.value)} className={inputClass} />
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
function ListInput({ label, hint, value, onChange }: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(", "));
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (splitList(text).join("\u0000") !== value.join("\u0000")) setText(value.join(", "));
  }
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelText}>{label}</span>
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(splitList(e.target.value));
        }}
        className={inputClass}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function ListEditor<T>({
  items,
  max,
  noun,
  blank,
  summary,
  onChange,
  render,
}: {
  items: T[];
  max: number;
  noun: string;
  blank: () => T;
  summary: (item: T) => string;
  onChange: (items: T[]) => void;
  render: (item: T, patch: (change: Partial<T>) => void) => ReactNode;
}) {
  const [opened, setOpened] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <details key={i} open={opened === i || undefined} className="rounded-xl border border-line">
          <summary className="cursor-pointer select-none px-3 py-2.5 font-medium">
            <span className="text-muted">{i + 1}.</span> {summary(item)}
          </summary>
          <div className="flex flex-col gap-4 border-t border-line p-3">
            {render(item, (change) => onChange(items.map((it, j) => (j === i ? { ...it, ...change } : it))))}
            <div className="flex flex-wrap gap-2 text-sm">
              <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className={ghostButton}>
                Move up
              </button>
              <button type="button" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} className={ghostButton}>
                Move down
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className={`${ghostButton} text-danger`}
              >
                Remove
              </button>
            </div>
          </div>
        </details>
      ))}
      {items.length < max ? (
        <button
          type="button"
          onClick={() => {
            onChange([...items, blank()]);
            setOpened(items.length);
          }}
          className={`${ghostButton} self-start`}
        >
          Add {noun}
        </button>
      ) : (
        <p className="text-xs text-muted">That’s the most this section can hold.</p>
      )}
    </div>
  );
}

/** The second password, asked before the first change and again every 15 minutes. */
function SavePasswordDialog({ open, onDone }: { open: boolean; onDone: (unlocked: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const close = (unlocked: boolean) => {
    setPassword("");
    setError(null);
    onDone(unlocked);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-password-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) close(false);
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const result = await unlockSaving(password);
          setBusy(false);
          if (result.ok) close(true);
          else setError(result.error);
        }}
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-xl"
      >
        <h2 id="save-password-title" className="text-base font-semibold">
          Save password
        </h2>
        <p className="text-sm text-muted">
          Changes to the site need the second password. After this, saving stays unlocked for 15 minutes.
        </p>
        <input
          type="password"
          autoFocus
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Save password"
          className={inputClass}
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => close(false)} disabled={busy} className={ghostButton}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || password.length === 0}
            className="h-10 rounded-xl bg-btn px-4 font-medium text-btn-fg disabled:opacity-50"
          >
            {busy ? "Checking…" : "Unlock"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Shown in the viewer's own time zone, which the server can't know, hence the warning opt-out. */
function LocalTime({ iso, dateOnly }: { iso: string; dateOnly?: boolean }) {
  const d = new Date(iso);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {dateOnly ? d.toLocaleDateString() : d.toLocaleString()}
    </time>
  );
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function ResumeCard(props: {
  resume: Resume | null;
  rev: number;
  blobReady: boolean;
  busy: boolean;
  onResult: (result: SaveResult, okText: string) => void;
  onRemove: () => void;
  ensureUnlocked: () => Promise<boolean>;
}) {
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      props.onResult({ ok: false, error: "Choose a PDF file." }, "");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      props.onResult({ ok: false, error: "The PDF is over 5 MB. Export a smaller one and try again." }, "");
      return;
    }
    setUploading(true);
    try {
      if (!(await props.ensureUnlocked())) {
        props.onResult({ ok: false, error: "Not uploaded. Changes need the save password." }, "");
        return;
      }
      const name = file.name.replace(/\.pdf$/i, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
      const blob = await upload(`resume/${name || "resume"}.pdf`, file, {
        access: "public",
        handleUploadUrl: "/admin/upload",
        contentType: "application/pdf",
      });
      props.onResult(await finishResumeUpload(props.rev, blob.url), "Résumé updated. The Résumé link now opens the new PDF.");
    } catch (error) {
      props.onResult({ ok: false, error: error instanceof Error ? error.message : "The upload failed." }, "");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Card title="Résumé" hint="The Résumé link on the site (/resume) always opens the newest PDF.">
      {props.resume ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <a href={props.resume.url} target="_blank" rel="noreferrer" className="font-medium text-link underline underline-offset-2">
            {props.resume.pathname.split("/").pop()}
          </a>
          <span className="text-muted">
            {formatSize(props.resume.size)} · uploaded <LocalTime iso={props.resume.uploadedAt} dateOnly />
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted">No résumé yet. Until you upload one, /resume shows a short “coming soon” note.</p>
      )}
      {props.blobReady ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className={`${ghostButton} cursor-pointer ${uploading || props.busy ? "pointer-events-none opacity-50" : ""}`}>
            {uploading ? "Uploading…" : props.resume ? "Upload a new PDF" : "Upload a PDF"}
            <input
              ref={input}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={uploading || props.busy}
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
          {props.resume && (
            <button type="button" onClick={props.onRemove} disabled={uploading || props.busy} className={`${ghostButton} text-danger`}>
              Remove
            </button>
          )}
          <span className="text-xs text-muted">PDF only, up to 5 MB.</span>
        </div>
      ) : (
        <p className="text-sm text-muted">To upload, connect a Blob store in Vercel → Storage first.</p>
      )}
    </Card>
  );
}
