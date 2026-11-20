"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  contentOf,
  contentSchema,
  issueText,
  type DefaultMode,
  type Design,
  type GameArt,
  type ImageKey,
  type SectionKey,
  type SiteContent,
  type SiteDoc,
} from "@/lib/site/schema";

import { defaultGames } from "@/lib/site/defaults";

import { logout, removeResume, saveContent, savingStatus, undoLastSave, type SaveResult } from "./actions";
import {
  Area,
  Card,
  ColorInput,
  ghostButton,
  Icon,
  ListEditor,
  ListInput,
  LocalTime,
  primaryButton,
  Range,
  Segmented,
  Select,
  Text,
  Toggle,
  useDragReorder,
  type IconName,
} from "./admin-ui";
import { clearDraft, publishDraft } from "./draft-channel";
import { ResumeCard } from "./resume-card";
import { SavePasswordDialog } from "./save-password-dialog";

type Status = { kind: "ok" | "error"; text: string; issues?: string[] } | null;

type TabId = "look" | "profile" | "work" | "experience" | "links";
const TABS: { id: TabId; label: string; icon: IconName; keys: (keyof SiteContent)[] }[] = [
  { id: "look", label: "Look", icon: "look", keys: ["design", "defaultMode", "sections", "sectionOrder"] },
  { id: "profile", label: "Profile", icon: "profile", keys: ["profile", "pixel"] },
  { id: "work", label: "Work", icon: "work", keys: ["projects", "earlier", "games"] },
  { id: "experience", label: "Experience", icon: "experience", keys: ["experience", "stack"] },
  { id: "links", label: "Links & resume", icon: "links", keys: ["links"] },
];
const tabOf = (key: PropertyKey): TabId => TABS.find((t) => t.keys.includes(key as keyof SiteContent))?.id ?? "look";

const MODE_OPTIONS: { value: DefaultMode; label: string; icon: IconName }[] = [
  { value: "system", label: "Device", icon: "device" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

const SECTIONS: Record<SectionKey, { label: string; note?: string }> = {
  projects: { label: "Projects" },
  earlier: { label: "Earlier work", note: "Side quests in Pixel" },
  games: { label: "Games", note: "Arcade in Pixel" },
  about: { label: "About" },
  experience: { label: "Experience" },
  stack: { label: "Stack", note: "Inventory in Pixel. Right below About, it shows inside About" },
  contact: { label: "Say hi" },
};

const CLIP_OPTIONS: { value: ImageKey; label: string }[] = [
  { value: "evenor", label: "Evenor clip" },
  { value: "life-vault", label: "Life Vault clip" },
  { value: "none", label: "None" },
];

const ART_OPTIONS: { value: GameArt; label: string }[] = [
  { value: "knight", label: "Knight on a board" },
  { value: "imposter", label: "Imposter players" },
  { value: "mafia", label: "Mafia night town" },
  { value: "patakha", label: "Patakha firecracker" },
  { value: "none", label: "None" },
];

export function AdminPanel(props: {
  initial: SiteDoc;
  initialCanUndo: boolean;
  storeReady: boolean;
  blobReady: boolean;
  /** Local development: one-click unlock in the save-password box. */
  localQuick?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(props.initial);
  const [draft, setDraft] = useState<SiteContent>(() => contentOf(props.initial));
  const [canUndo, setCanUndo] = useState(props.initialCanUndo);
  const [status, setStatus] = useState<Status>(null);
  const [tab, setTab] = useState<TabId>("look");
  const [pending, startTransition] = useTransition();
  const savedContent = useMemo(() => contentOf(saved), [saved]);
  const changedKeys = useMemo(
    () => (Object.keys(draft) as (keyof SiteContent)[]).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(savedContent[k])),
    [draft, savedContent],
  );
  const dirty = changedKeys.length > 0;
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

  const notSaved = () => setStatus({ kind: "error", text: "Not saved: changes need the save password." });

  // Keep the preview tab in step with every edit.
  useEffect(() => {
    publishDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** keepDraft: resume changes save on their own and must not throw away unsaved text edits. */
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
      // Jump to the tab with the first problem.
      setTab(tabOf(check.error.issues[0]?.path[0] ?? "design"));
      setStatus({ kind: "error", text: "A few fields need fixing first.", issues: check.error.issues.slice(0, 6).map(issueText) });
      return;
    }
    startTransition(async () => {
      const result = await runChange(() => saveContent(saved.rev, draft));
      if (result) apply(result, "Saved. The site shows it now.");
      else notSaved();
    });
  }

  function undo() {
    const note = dirty ? " Unsaved edits on this page will be lost too." : "";
    if (!window.confirm(`Go back to the version before your last save?${note}`)) return;
    startTransition(async () => {
      const result = await runChange(() => undoLastSave(saved.rev));
      if (result) apply(result, "Undone. The site is back to the previous version.");
      else notSaved();
    });
  }

  /** Every edit clears the last save message, so it never describes stale state. */
  const edit = (change: (d: SiteContent) => SiteContent) => {
    setDraft(change);
    setStatus(null);
  };
  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => edit((d) => ({ ...d, [key]: value }));
  const setProfile = (key: keyof SiteContent["profile"], value: string) =>
    edit((d) => ({ ...d, profile: { ...d.profile, [key]: value } }));
  const setPixel = (key: "greeting" | "intro" | "ticker", value: string) =>
    edit((d) => ({ ...d, pixel: { ...d.pixel, [key]: value } }));

  const notebookHero = (
    <Card key="nb" title="Hero" badge="Notebook">
      <Area label="Headline" rows={2} value={draft.profile.headline} max={160} onChange={(v) => setProfile("headline", v)} />
      <Area label="Intro" rows={3} value={draft.profile.intro} max={400} onChange={(v) => setProfile("intro", v)} />
      <Text label="Now line" hint="Project names become links" value={draft.profile.now} max={120} onChange={(v) => setProfile("now", v)} />
    </Card>
  );
  const pixelHero = (
    <Card key="px" title="Hero" badge="Pixel">
      <Text label="Greeting" value={draft.pixel.greeting} max={60} onChange={(v) => setPixel("greeting", v)} />
      <Area label="Intro" rows={3} value={draft.pixel.intro} max={300} onChange={(v) => setPixel("intro", v)} />
      <Text label="Board lines" hint="Use /// between lines · one shows at a time" value={draft.pixel.ticker} max={160} onChange={(v) => setPixel("ticker", v)} />
      <Range
        label="Time per board line"
        value={draft.pixel.boardSeconds}
        min={2}
        max={12}
        step={0.5}
        format={(v) => `${v} s`}
        onChange={(v) => edit((d) => ({ ...d, pixel: { ...d.pixel, boardSeconds: v } }))}
      />
    </Card>
  );

  return (
    <div className="min-h-dvh pb-40">
      <header className="mx-auto flex max-w-3xl flex-wrap items-end justify-between gap-3 px-4 pb-5 pt-8 sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            <span className="pp-light" data-status="ok" aria-hidden="true" />
            /admin · signed in
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Site admin</h1>
          <p className="mt-0.5 text-sm text-muted">
            Saved <LocalTime iso={saved.updatedAt} /> · v{saved.rev}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" rel="noreferrer" className={ghostButton}>
            <Icon name="external" />
            View site
          </a>
          <form
            action={async () => {
              clearDraft();
              await logout();
              router.refresh();
            }}
          >
            <button type="submit" className={ghostButton} aria-label="Sign out" title="Sign out">
              <Icon name="logout" />
            </button>
          </form>
        </div>
      </header>

      <nav aria-label="Admin sections" className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {TABS.map((t) => {
            const on = tab === t.id;
            const changed = t.keys.some((k) => changedKeys.includes(k));
            return (
              <button
                key={t.id}
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => setTab(t.id)}
                className={`relative flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
                  on ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-muted hover:text-fg"
                }`}
              >
                <Icon name={t.icon} />
                {t.label}
                {changed && <span className="size-1.5 rounded-full bg-accent" aria-label="unsaved changes" />}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pt-6 sm:px-6">
        {!props.storeReady && (
          <p className="rounded-xl border border-danger/40 bg-surface p-3 text-sm text-danger">
            Storage isn’t connected, so saving won’t work yet.
          </p>
        )}

        {tab === "look" && (
          <>
            <Card title="Design">
              <div role="radiogroup" aria-label="Design" className="grid gap-3 sm:grid-cols-2">
                <DesignOption value="notebook" current={draft.design} onSelect={(v) => set("design", v)} />
                <DesignOption value="pixel" current={draft.design} onSelect={(v) => set("design", v)} />
              </div>
            </Card>
            <Card title="Theme for new visitors">
              <Segmented
                label="Theme for new visitors"
                value={draft.defaultMode}
                options={MODE_OPTIONS}
                onChange={(v) => set("defaultMode", v)}
              />
              <p className="text-xs text-muted">Anyone who presses the bulb keeps their own choice.</p>
            </Card>
            <Card title="Sections">
              <SectionOrder
                order={draft.sectionOrder}
                on={draft.sections}
                onOrder={(order) => set("sectionOrder", order)}
                onToggle={(key, on) => set("sections", { ...draft.sections, [key]: on })}
              />
            </Card>
          </>
        )}

        {tab === "profile" && (
          <>
            <Card title="Basics">
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Name" value={draft.profile.name} max={60} onChange={(v) => setProfile("name", v)} />
                <Text label="Role" value={draft.profile.role} max={60} onChange={(v) => setProfile("role", v)} />
              </div>
              <Text label="Email" type="email" value={draft.profile.email} max={120} onChange={(v) => setProfile("email", v)} />
            </Card>
            {draft.design === "pixel" ? [pixelHero, notebookHero] : [notebookHero, pixelHero]}
            <Card title="About & say hi">
              <Area
                label="About"
                hint="Blank line starts a new paragraph"
                rows={6}
                value={draft.profile.about}
                max={1200}
                onChange={(v) => setProfile("about", v)}
              />
              <Area
                label="Say hi"
                rows={2}
                value={draft.profile.contactLine}
                max={200}
                onChange={(v) => setProfile("contactLine", v)}
              />
            </Card>
          </>
        )}

        {tab === "work" && (
          <>
            <Card title="Projects" aside={<Count n={draft.projects.length} />}>
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
                title={(p) => p.name}
                subtitle={(p) => p.tag}
                dot={(p) => p.brand}
                onChange={(items) => set("projects", items)}
                render={(p, patch) => (
                  <>
                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                      <Text label="Name" value={p.name} max={40} onChange={(v) => patch({ name: v })} />
                      <Text label="Badge" placeholder="Live" value={p.status} max={16} onChange={(v) => patch({ status: v })} />
                    </div>
                    <Text label="Tagline" value={p.tag} max={80} onChange={(v) => patch({ tag: v })} />
                    <Area label="Description" rows={2} value={p.one} max={400} onChange={(v) => patch({ one: v })} />
                    <ListInput label="Stack" value={p.stack} onChange={(v) => patch({ stack: v })} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Text label="Live link" placeholder="https://" value={p.liveHref} max={500} onChange={(v) => patch({ liveHref: v })} />
                      <Text label="Source link" placeholder="https://github.com/…" value={p.codeHref} max={500} onChange={(v) => patch({ codeHref: v })} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Select label="Clip" value={p.imageKey} options={CLIP_OPTIONS} onChange={(v) => patch({ imageKey: v })} />
                      <ColorInput label="Background" value={p.brand} onChange={(v) => patch({ brand: v })} />
                      <ColorInput label="Phone frame" value={p.bezel} onChange={(v) => patch({ bezel: v })} />
                    </div>
                  </>
                )}
              />
            </Card>
            <Card title="Earlier work" aside={<Count n={draft.earlier.length} />}>
              <ListEditor
                items={draft.earlier}
                max={10}
                noun="item"
                blank={() => ({ name: "", what: "", meta: "", href: "" })}
                title={(e) => e.name}
                subtitle={(e) => e.what}
                onChange={(items) => set("earlier", items)}
                render={(e, patch) => (
                  <>
                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                      <Text label="Name" value={e.name} max={60} onChange={(v) => patch({ name: v })} />
                      <Text label="Note" placeholder="Freelance" value={e.meta} max={40} onChange={(v) => patch({ meta: v })} />
                    </div>
                    <Text label="What it is" value={e.what} max={200} onChange={(v) => patch({ what: v })} />
                    <Text label="Link" placeholder="Optional" value={e.href} max={500} onChange={(v) => patch({ href: v })} />
                  </>
                )}
              />
            </Card>
            <Card title="Games" aside={<Count n={draft.games.length} />}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 flex-1 text-xs text-muted">
                  The built-in list has every game with its link and picture. Using it replaces this list; Save to keep it.
                </p>
                <button type="button" className={ghostButton} onClick={() => set("games", defaultGames.map((g) => ({ ...g })))}>
                  Use the built-in games
                </button>
              </div>
              <ListEditor
                items={draft.games}
                max={6}
                noun="game"
                blank={() => ({ name: "", what: "", meta: "", href: "https://games.huhharshal.com/", art: "none" as const })}
                title={(g) => g.name}
                subtitle={(g) => g.what}
                onChange={(items) => set("games", items)}
                render={(g, patch) => (
                  <>
                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                      <Text label="Name" value={g.name} max={60} onChange={(v) => patch({ name: v })} />
                      <Text label="Kind" placeholder="Puzzle" value={g.meta} max={40} onChange={(v) => patch({ meta: v })} />
                    </div>
                    <Text label="One line" value={g.what} max={200} onChange={(v) => patch({ what: v })} />
                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                      <Text label="Link" value={g.href} max={500} onChange={(v) => patch({ href: v })} />
                      <Select label="Picture" value={g.art} options={ART_OPTIONS} onChange={(v) => patch({ art: v })} />
                    </div>
                  </>
                )}
              />
            </Card>
          </>
        )}

        {tab === "experience" && (
          <>
            <Card title="Experience" aside={<Count n={draft.experience.length} />}>
              <ListEditor
                items={draft.experience}
                max={10}
                noun="role"
                blank={() => ({ org: "", role: "", when: "", what: "" })}
                title={(x) => x.org}
                subtitle={(x) => [x.role, x.when].filter(Boolean).join(" · ")}
                onChange={(items) => set("experience", items)}
                render={(x, patch) => (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Text label="Company or school" value={x.org} max={60} onChange={(v) => patch({ org: v })} />
                      <Text label="Role" value={x.role} max={80} onChange={(v) => patch({ role: v })} />
                    </div>
                    <Text label="When" placeholder="Mar 2026 – now" value={x.when} max={40} onChange={(v) => patch({ when: v })} />
                    <Area label="One line on the work" rows={2} value={x.what} max={300} onChange={(v) => patch({ what: v })} />
                  </>
                )}
              />
            </Card>
            <Card title="Stack" aside={<Count n={draft.stack.length} />}>
              <ListEditor
                items={draft.stack}
                max={8}
                noun="row"
                blank={() => ({ k: "", v: "" })}
                title={(r) => r.k}
                subtitle={(r) => r.v}
                onChange={(items) => set("stack", items)}
                render={(r, patch) => (
                  <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                    <Text label="Group" value={r.k} max={20} onChange={(v) => patch({ k: v })} />
                    <Text label="Tools" value={r.v} max={160} onChange={(v) => patch({ v })} />
                  </div>
                )}
              />
            </Card>
          </>
        )}

        {tab === "links" && (
          <>
            <Card title="Links" aside={<Count n={draft.links.length} />}>
              <ListEditor
                items={draft.links}
                max={8}
                noun="link"
                blank={() => ({ label: "", href: "https://" })}
                title={(l) => l.label}
                subtitle={(l) => l.href}
                onChange={(items) => set("links", items)}
                render={(l, patch) => (
                  <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                    <Text label="Label" value={l.label} max={30} onChange={(v) => patch({ label: v })} />
                    <Text label="Link" hint="https://, mailto: or /resume" value={l.href} max={500} onChange={(v) => patch({ href: v })} />
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
                if (!window.confirm("Remove the resume? /resume will show a “coming soon” note until you upload a new one.")) return;
                startTransition(async () => {
                  const result = await runChange(() => removeResume(saved.rev));
                  if (result) apply(result, "Resume removed.", true);
                  else notSaved();
                });
              }}
            />
          </>
        )}
      </main>

      <SavePasswordDialog
        open={askingPassword}
        localQuick={props.localQuick}
        onDone={(unlocked) => {
          setAskingPassword(false);
          answer.current?.(unlocked);
          answer.current = null;
        }}
      />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <div className="min-w-0 basis-full text-sm sm:basis-auto sm:flex-1" aria-live="polite">
            {status ? (
              <div className={status.kind === "error" ? "text-danger" : "text-fg"}>
                <p className="flex items-center gap-1.5">
                  {status.kind === "ok" && <Icon name="check" className="size-4 text-[#22a06b]" />}
                  {status.text}
                </p>
                {status.issues && (
                  <ul className="mt-1 list-disc pl-5 text-xs">
                    {status.issues.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-muted">
                {dirty ? `${changedKeys.length} unsaved change${changedKeys.length === 1 ? "" : "s"}` : "All changes saved"}
              </p>
            )}
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            {dirty && (
              <button type="button" onClick={() => edit(() => contentOf(saved))} disabled={pending} className={ghostButton}>
                Discard
              </button>
            )}
            <button
              type="button"
              onClick={undo}
              disabled={pending || !canUndo}
              className={ghostButton}
              aria-label="Undo last save"
              title="Undo last save"
            >
              <Icon name="undo" />
            </button>
            <a href="/admin/preview" target="hs-preview" className={ghostButton} title="Live preview of your edits">
              <Icon name="eye" />
              Preview
            </a>
            <button type="button" onClick={save} disabled={pending || !dirty} className={primaryButton}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="font-mono text-xs text-muted">{n}</span>;
}

/** A design choice with a small drawing of what it looks like. */
function DesignOption({ value, current, onSelect }: { value: Design; current: Design; onSelect: (v: Design) => void }) {
  const on = value === current;
  const name = value === "pixel" ? "Pixel" : "Notebook";
  return (
    <div
      className={`relative overflow-hidden rounded-xl border transition ${
        on ? "border-accent ring-4 ring-accent/15" : "border-line hover:border-muted/40"
      }`}
    >
      <button type="button" role="radio" aria-checked={on} onClick={() => onSelect(value)} className="block w-full text-left">
        {value === "pixel" ? <PixelThumb /> : <NotebookThumb />}
        <span className="flex items-center gap-2 border-t border-line bg-surface px-3.5 py-2.5">
          <span
            className={`grid size-4 place-items-center rounded-full border ${on ? "border-accent bg-accent text-accent-fg" : "border-line"}`}
          >
            {on && <Icon name="check" className="size-3" />}
          </span>
          <span className="text-sm font-medium">{name}</span>
        </span>
      </button>
      <a
        href={`/admin/preview?design=${value}`}
        target="hs-preview"
        className="absolute bottom-2 right-2 inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-link transition hover:bg-accent-soft"
      >
        <Icon name="eye" className="size-3.5" />
        Preview
      </a>
    </div>
  );
}

function NotebookThumb() {
  return (
    <span className="relative block h-28 overflow-hidden bg-bg">
      <span
        className="absolute inset-0 opacity-70 mix-blend-overlay"
        style={{ backgroundImage: "url(/grain.png)", backgroundSize: "120px 120px" }}
      />
      <span className="absolute right-6 top-0 h-7 w-px bg-fg/50" />
      <span className="absolute right-[19px] top-7 size-3 rounded-full bg-[#ffd54a] shadow-[0_0_10px_rgba(255,196,0,0.8)]" />
      <span className="relative flex h-full flex-col justify-center gap-2 px-4">
        <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 500, fontSize: 28, lineHeight: 1 }}>
          Aa
        </span>
        <span className="flex gap-1.5">
          <span className="h-2.5 w-9 rounded-full border border-line bg-surface" />
          <span className="h-2.5 w-7 rounded-full border border-line bg-surface" />
          <span className="h-2.5 w-10 rounded-full border border-line bg-surface" />
        </span>
      </span>
    </span>
  );
}

// A few lit cells of the pixel board, as a tiny pattern.
const BOARD = "XX.X.XXX.X..X.X.XX.X.XXX..X.XX.X.X.XX..XXX.X";

function PixelThumb() {
  return (
    <span className="relative block h-28 overflow-hidden bg-bg">
      <span className="absolute right-5 top-4 text-[13px] leading-none text-accent">+</span>
      <span className="absolute left-[62%] top-9 text-[11px] leading-none text-[#22a06b]">+</span>
      <span className="absolute right-6 top-0 h-7 w-0.5 bg-[repeating-linear-gradient(to_bottom,var(--fg)_0_3px,transparent_3px_5px)]" />
      <span className="absolute right-[21px] top-7 size-3 bg-[#ffc93c] shadow-[0_0_10px_rgba(255,196,0,0.8)]" />
      <span className="relative flex h-full flex-col justify-center gap-2.5 px-4">
        <span style={{ fontFamily: "var(--font-pixelify), monospace", fontWeight: 600, fontSize: 28, lineHeight: 1 }}>Aa</span>
        <span className="grid w-max grid-cols-[repeat(15,6px)] gap-px">
          {BOARD.split("").map((c, i) => (
            <span key={i} className={`size-[6px] ${c === "X" ? (i % 7 === 0 ? "bg-accent" : "bg-fg") : "bg-pat"}`} />
          ))}
        </span>
      </span>
    </span>
  );
}

/** The page's sections in order: drag to reorder, switch to show or hide. */
function SectionOrder(props: {
  order: SectionKey[];
  on: Record<SectionKey, boolean>;
  onOrder: (order: SectionKey[]) => void;
  onToggle: (key: SectionKey, on: boolean) => void;
}) {
  const drag = useDragReorder(props.order.length, (from, to) => {
    const next = [...props.order];
    const [key] = next.splice(from, 1);
    next.splice(to, 0, key);
    props.onOrder(next);
  });
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">Top to bottom, as on the page, after the intro. Drag to change the order.</p>
      <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {props.order.map((key, i) => (
          <li
            key={key}
            ref={drag.rowRef(i)}
            className={`flex items-stretch ${drag.dragging === i ? "relative z-10 bg-surface2 shadow-lg" : "bg-bg"}`}
          >
            {drag.handle(i, SECTIONS[key].label)}
            <Toggle
              label={SECTIONS[key].label}
              note={SECTIONS[key].note}
              checked={props.on[key]}
              onChange={(on) => props.onToggle(key, on)}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pl-1 pr-3.5 text-left transition hover:bg-surface2"
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
