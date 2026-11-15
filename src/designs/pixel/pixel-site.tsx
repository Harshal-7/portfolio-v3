import type { CSSProperties, ReactNode } from "react";

import type { SiteDoc } from "@/lib/site/schema";
import { splitLead, visibleSections } from "@/lib/site/view";

import { footerText, Paragraphs, ProjectMedia, type Labels } from "../shared/parts";
import { PixelBulb } from "./pixel-bulb";

import "./pixel.css";

const LABELS: Labels = {
  projects: "Projects",
  earlier: "Side quests",
  about: "About",
  experience: "Experience",
  stack: "Inventory",
  contact: "Say hi",
};

// [top, left, size px, colour 1-4, delay, duration], kept near the edges.
const SPARKS: [string, string, number, number, string, string][] = [
  ["3%", "5%", 4, 1, "0s", "3.4s"], ["5%", "90%", 5, 2, "1.1s", "4.2s"], ["9%", "48%", 4, 3, "2.3s", "3.8s"],
  ["14%", "94%", 4, 4, "0.6s", "4.6s"], ["18%", "2%", 5, 2, "1.8s", "3.6s"], ["24%", "91%", 4, 1, "2.9s", "4.4s"],
  ["31%", "96%", 4, 3, "0.3s", "3.9s"], ["37%", "1%", 4, 4, "1.5s", "4.1s"], ["44%", "93%", 5, 1, "2.2s", "3.5s"],
  ["51%", "3%", 4, 2, "0.9s", "4.8s"], ["58%", "95%", 4, 3, "1.9s", "3.7s"], ["64%", "2%", 5, 4, "2.6s", "4.3s"],
  ["71%", "92%", 4, 1, "0.4s", "3.9s"], ["78%", "4%", 4, 2, "1.3s", "4.5s"], ["84%", "90%", 5, 3, "2.1s", "3.6s"],
  ["90%", "3%", 4, 4, "0.7s", "4.0s"], ["95%", "94%", 4, 1, "1.6s", "4.7s"], ["98%", "49%", 4, 2, "2.4s", "3.8s"],
];

/**
 * The greeting, letter by letter: each letter pops in after the one before, on
 * load and again on every theme switch. Words never break across lines.
 */
function PoppingText({ text }: { text: string }) {
  const parts = text.split(/(\s+)/);
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((n, p) => n + (/^\s+$/.test(p) ? 0 : [...p].length), 0));
  return (
    <>
      {parts.map((part, wi) =>
        /^\s+$/.test(part) || part === "" ? (
          part
        ) : (
          <span key={wi} className="px-word">
            {[...part].map((ch, li) => (
              <span key={li} className="px-pop px-letter" style={{ animationDelay: `${((starts[wi] + li) * 0.04).toFixed(2)}s` }}>
                {ch}
              </span>
            ))}
          </span>
        ),
      )}
    </>
  );
}

function Heading({ id, label }: { id?: string; label: string }) {
  return (
    <div className="px-h2row" id={id}>
      <span aria-hidden="true" className="px-bullet" />
      <h2 className="px-h2">{label}</h2>
    </div>
  );
}

function Key({ href, children, accent, className }: { href: string; children: ReactNode; accent?: boolean; className?: string }) {
  return (
    <span className="px-keywrap">
      <a href={href} className={`px-key${accent ? " px-key-accent" : ""}${className ? ` ${className}` : ""}`}>
        {children}
      </a>
    </span>
  );
}

const Tri = () => <span aria-hidden="true" className="px-tri" />;

/**
 * Pixel: pixel layout, Pixelify Sans + Geist, Indigo, twinkling sparkles, pixel
 * bulb burst, pixel cards. Mix D on the design canvas.
 */
export function PixelSite({ site }: { site: SiteDoc }) {
  const show = visibleSections(site);
  const { profile, pixel } = site;
  const footer = footerText(site);
  const [contactLead, contactRest] = splitLead(profile.contactLine);

  const showProjects = show.has("projects") && site.projects.length > 0;
  const showEarlier = show.has("earlier") && site.earlier.length > 0;
  const showAbout = show.has("about") && profile.about.trim().length > 0;
  const showExperience = show.has("experience") && site.experience.length > 0;

  return (
    <div id="top" className="hs-site px-site">
      <div aria-hidden="true" className="px-sparks">
        {SPARKS.map(([top, left, px, c, delay, dur], i) => {
          const color = `var(--spark${c})`;
          const style: CSSProperties = {
            top,
            left,
            width: px,
            height: px,
            background: color,
            boxShadow: `${px}px 0 0 ${color}, -${px}px 0 0 ${color}, 0 ${px}px 0 ${color}, 0 -${px}px 0 ${color}`,
            animationDelay: delay,
            animationDuration: dur,
          };
          return <span key={i} className="px-spark" style={style} />;
        })}
      </div>

      <div className="px-wrap">
        <PixelBulb />

        <header className="px-header">
          <span aria-hidden="true" className="px-badge">
            HS
          </span>
          <span className="px-name">{profile.name}</span>
        </header>

        <main>
          <section aria-label="Intro" className="px-intro">
            <h1 className="px-h1" aria-label={pixel.greeting}>
              <span aria-hidden="true">
                <PoppingText text={pixel.greeting} />
              </span>
            </h1>
            {pixel.intro && <p className="px-lede">{pixel.intro}</p>}
            {pixel.ticker && (
              <div className="px-ticker" role="marquee" aria-label={pixel.ticker}>
                <div className="px-marquee" aria-hidden="true">
                  <span>{pixel.ticker}</span>
                  <span>{pixel.ticker}</span>
                </div>
              </div>
            )}
            {site.links.length > 0 && (
              <nav aria-label="Links" className="px-keys">
                {site.links.map((l, i) => (
                  <Key key={`${i}-${l.label}`} href={l.href}>
                    {l.label}
                  </Key>
                ))}
              </nav>
            )}
          </section>

          {(showProjects || showEarlier) && (
            <section aria-label={showProjects ? LABELS.projects : LABELS.earlier}>
              <Heading id="work" label={showProjects ? LABELS.projects : LABELS.earlier} />
              {showProjects && (
                <div className="px-cards">
                  {site.projects.map((p, i) => (
                    <article key={`${i}-${p.name}`} className="px-card">
                      <ProjectMedia
                        project={p}
                        className="px-media"
                        phonesClass="px-phones"
                        phoneClass="px-phone"
                        backClass="px-phone-back"
                        shotClass="px-shot"
                        phoneWidth={132}
                      />
                      <div className="px-card-body">
                        <div className="px-card-top">
                          <h3 className="px-card-name">{p.name}</h3>
                          {p.status && <span className="px-status">{p.status.toUpperCase()}</span>}
                        </div>
                        {p.tag && <p className="px-tag">{p.tag}</p>}
                        {p.one && <p className="px-one">{p.one}</p>}
                        {p.stack.length > 0 && (
                          <div className="px-chips">
                            {p.stack.map((s, j) => (
                              <span key={`${j}-${s}`} className="px-chip">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {(p.liveHref || p.codeHref) && (
                          <div className="px-card-actions">
                            {p.liveHref && (
                              <Key href={p.liveHref} accent className="px-key-small">
                                Open <Tri />
                              </Key>
                            )}
                            {p.codeHref && (
                              <a href={p.codeHref} className="px-source">
                                Source
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {showEarlier && (
                <>
                  {showProjects && <h3 className="px-sub">{LABELS.earlier}</h3>}
                  <ul className="px-list">
                    {site.earlier.map((e, i) => {
                      const body = (
                        <>
                          <span className="px-earlier-top">
                            <span className="px-earlier-name">{e.name}</span>
                            {(e.meta || e.href) && (
                              <span className="px-earlier-meta">
                                {e.meta}
                                {e.href ? " ↗" : ""}
                              </span>
                            )}
                          </span>
                          {e.what && <span className="px-earlier-what">{e.what}</span>}
                        </>
                      );
                      return (
                        <li key={`${i}-${e.name}`}>
                          {e.href ? (
                            <a href={e.href} className="px-earlier">
                              {body}
                            </a>
                          ) : (
                            <div className="px-earlier">{body}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
          )}

          {(showAbout || showExperience) && (
            <section aria-label={showAbout ? LABELS.about : LABELS.experience}>
              <Heading id="about" label={showAbout ? LABELS.about : LABELS.experience} />
              {showAbout && (
                <div className="px-about">
                  <Paragraphs text={profile.about} />
                </div>
              )}
              {showExperience && (
                <>
                  {showAbout && <h3 className="px-sub px-sub-exp">{LABELS.experience}</h3>}
                  <ol className="px-list">
                    {site.experience.map((x, i) => (
                      <li key={`${i}-${x.org}`} className="px-exp">
                        <div className="px-exp-main">
                          <span className="px-org">{x.org}</span>
                          {x.role && <span className="px-exp-role">{x.role}</span>}
                          {x.what && <span className="px-exp-what">{x.what}</span>}
                        </div>
                        {x.when && <span className="px-when">{x.when}</span>}
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </section>
          )}

          {show.has("stack") && site.stack.length > 0 && (
            <section aria-label={LABELS.stack}>
              <Heading label={LABELS.stack} />
              <dl className="px-stack">
                {site.stack.map((row, i) => (
                  <div key={`${i}-${row.k}`}>
                    <dt>{row.k}</dt>
                    <dd>{row.v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {show.has("contact") && (
            <section aria-label={LABELS.contact}>
              <Heading id="contact" label={LABELS.contact} />
              <div className="px-contact">
                {contactLead && <p className="px-contact-lead">{contactLead}</p>}
                {contactRest && <p className="px-contact-rest">{contactRest}</p>}
                <div className="px-contact-row">
                  <Key href={`mailto:${profile.email}`} accent className="px-key-big">
                    Email me <Tri />
                  </Key>
                  <span className="px-email">{profile.email}</span>
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="px-footer">
          <span>{footer.left}</span>
          <span>{footer.right}</span>
        </footer>
      </div>
    </div>
  );
}
