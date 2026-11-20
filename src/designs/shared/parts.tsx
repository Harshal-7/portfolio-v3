
import type { Project, SiteDoc } from "@/lib/site/schema";
import { linkNames, monthYear, PROJECT_MEDIA, yearOf } from "@/lib/site/view";

import { LoopVideo } from "./loop-video";

/** Section headings each design uses. */
export type Labels = {
  projects: string;
  earlier: string;
  games: string;
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

/** The project's looping demo clip in a phone, on its brand colour. */
export function ProjectMedia({
  project,
  className,
  phoneClass,
}: {
  project: Project;
  className: string;
  phoneClass: string;
}) {
  const media = project.imageKey === "none" ? null : PROJECT_MEDIA[project.imageKey];
  return (
    <div className={className} style={{ background: project.brand }}>
      {media && (
        <LoopVideo
          mp4={media.mp4}
          webm={media.webm}
          poster={media.poster}
          label={media.label}
          width={media.width}
          height={media.height}
          className={`${phoneClass} ${media.framed ? "is-framed" : "is-bezel"}`}
          style={media.framed ? undefined : { borderColor: project.bezel }}
        />
      )}
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
