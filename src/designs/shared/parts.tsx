import Image from "next/image";
import type { ReactNode } from "react";

import type { Project, SiteDoc } from "@/lib/site/schema";
import { linkNames, monthYear, PROJECT_IMAGES, yearOf } from "@/lib/site/view";

/** Section headings each design uses. */
export type Labels = {
  projects: string;
  earlier: string;
  about: string;
  experience: string;
  stack: string;
  contact: string;
};

/** The "Now building …" line, with project names linked to the projects section. */
export function NowLine({ text, names, linkClass }: { text: string; names: string[]; linkClass?: string }) {
  return (
    <>
      {linkNames(text, names).map((part, i) =>
        part.anchor ? (
          <a key={i} href="#work" className={linkClass}>
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

/** Blank lines in the admin text become paragraphs. */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}

/** Phone screenshots or a single screenshot on the project's brand colour. */
export function ProjectMedia({
  project,
  className,
  phonesClass,
  phoneClass,
  backClass,
  shotClass,
  phoneWidth,
}: {
  project: Project;
  className: string;
  phonesClass: string;
  phoneClass: string;
  backClass: string;
  shotClass: string;
  phoneWidth: number;
}) {
  const media = project.imageKey === "none" ? null : PROJECT_IMAGES[project.imageKey];
  let inner: ReactNode = null;
  if (media?.kind === "phones") {
    inner = (
      <div className={phonesClass}>
        <Image
          src={media.back.src}
          alt={media.back.alt}
          width={media.width}
          height={media.height}
          sizes={`${phoneWidth}px`}
          className={`${phoneClass} ${backClass}`}
          style={{ borderColor: project.bezel }}
        />
        <Image
          src={media.front.src}
          alt={media.front.alt}
          width={media.width}
          height={media.height}
          sizes={`${phoneWidth}px`}
          className={phoneClass}
          style={{ borderColor: project.bezel }}
        />
      </div>
    );
  } else if (media?.kind === "shot") {
    inner = (
      <Image
        src={media.front.src}
        alt={media.front.alt}
        fill
        sizes="(max-width: 760px) 100vw, 720px"
        className={shotClass}
      />
    );
  }
  return (
    <div className={className} style={{ background: project.brand }}>
      {inner}
    </div>
  );
}

export function footerText(site: SiteDoc): { left: string; right: string } {
  const first = site.profile.name.split(" ")[0] || site.profile.name;
  return {
    left: `© ${yearOf(site.updatedAt)} ${site.profile.name}`,
    right: `Designed and built by ${first} · Last updated ${monthYear(site.updatedAt)}`,
  };
}
