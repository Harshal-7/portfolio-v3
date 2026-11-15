import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { PixelBulb } from "@/designs/pixel/pixel-bulb";
import {
  HeaderBadgeName,
  HeaderMark,
  HeaderMarkWordmark,
  HeaderWordmark,
  PixelMarkSvg,
} from "@/designs/pixel/header-options";
import { FlapTicker, HotbarTicker, LedTicker, SplashTicker, TerminalTicker } from "@/designs/pixel/ticker-options";
import { getSite } from "@/lib/site/get-site";

import "@/designs/pixel/pixel.css";
import "./lab.css";
import { ThemeSwitch } from "./theme-switch";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };

/** Local-only page for comparing design options. Not available in production. */
export default async function LabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const site = await getSite();
  const ticker = site.pixel.ticker;

  return (
    <main className="mx-auto flex max-w-[760px] flex-col gap-10 px-5 pb-24 pt-10 font-sans text-fg">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Local only · not on the live site</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Pixel design options</h1>
          <p className="mt-1 text-muted">Pick a ticker and a header, then tell Claude the letters.</p>
        </div>
        <ThemeSwitch />
      </header>

      <Group title="Now-building strip" note="Uses your ticker text, split into lines at ///.">
        <Sample id="A" name="LED marquee" tag="current">
          <LedTicker text={ticker} />
        </Sample>
        <Sample id="B" name="Hotbar" tag="Minecraft">
          <HotbarTicker text={ticker} />
        </Sample>
        <Sample id="C" name="Splash text" tag="Minecraft">
          <SplashTicker text={ticker} />
        </Sample>
        <Sample id="D" name="Terminal" tag="futuristic">
          <TerminalTicker text={ticker} />
        </Sample>
        <Sample id="E" name="Split-flap board" tag="retro-futuristic">
          <FlapTicker text={ticker} />
        </Sample>
      </Group>

      <Group title="Header" note="Each has the real bulb: move the mouse near it to see it sway, press it to switch theme.">
        <Sample id="1" name="Badge + full name" tag="current" header>
          <HeaderBadgeName name={site.profile.name} />
        </Sample>
        <Sample id="2" name="Pixel HS block only" header>
          <HeaderMark />
        </Sample>
        <Sample id="3" name="Pixel HS + domain" header>
          <HeaderMarkWordmark />
        </Sample>
        <Sample id="4" name="Domain wordmark only" tag="Claude’s pick" header>
          <HeaderWordmark />
        </Sample>
      </Group>

      <Group title="Pixel HS as the browser-tab icon" note="Claude’s pick for where the HS block lives, so the page itself doesn’t repeat the name.">
        <div className="flex items-end gap-6 rounded-2xl border border-dashed border-line p-5">
          <PixelMarkSvg size={16} />
          <PixelMarkSvg size={32} />
          <PixelMarkSvg size={64} />
          <PixelMarkSvg size={120} />
        </div>
      </Group>
    </main>
  );
}

function Group({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Sample(props: { id: string; name: string; tag?: string; header?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-baseline gap-2 font-mono text-xs uppercase tracking-[0.12em]">
        <span className="font-semibold text-fg">{props.id}</span>
        <span className="text-fg">{props.name}</span>
        {props.tag && <span className="text-muted">· {props.tag}</span>}
      </p>
      <div className="hs-site px-site lab-sample">
        <div className="px-wrap">
          {props.header ? (
            <>
              <PixelBulb />
              <div className="px-header">{props.children}</div>
            </>
          ) : (
            <div className="pt-4">{props.children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
