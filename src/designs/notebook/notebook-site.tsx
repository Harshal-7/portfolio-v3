import type { SiteDoc } from "@/lib/site/schema";
import { findLink, visibleSections } from "@/lib/site/view";

import { footerText, NowLine, Paragraphs, ProjectMedia, type Labels } from "../shared/parts";
import { PullCordBulb } from "./pull-cord-bulb";

import "./notebook.css";

const LABELS: Labels = {
  projects: "Projects",
  earlier: "Earlier work",
  about: "About",
  experience: "Experience",
  stack: "Stack",
  contact: "Say hi",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * Notebook: Quiet layout, Fraunces + Inter, Indigo, paper grain, pull-cord bulb,
 * project tiles. Mix B on the design canvas, with mix A's colours.
 */
export function NotebookSite({ site }: { site: SiteDoc }) {
  const show = visibleSections(site);
  const { profile } = site;
  const names = site.projects.map((p) => p.name);
  const linkedIn = findLink(site.links, "linkedin.com");
  const footer = footerText(site);

  const showProjects = show.has("projects") && site.projects.length > 0;
  const showEarlier = show.has("earlier") && site.earlier.length > 0;
  const showAbout = show.has("about") && profile.about.trim().length > 0;
  const showExperience = show.has("experience") && site.experience.length > 0;

  return (
    <div id="top" className="hs-site nb-site">
      <div aria-hidden="true" className="nb-noise" />
      <div className="nb-wrap">
        <PullCordBulb />

        <header className="nb-header">
          <span aria-hidden="true" className="nb-avatar">
            {initials(profile.name)}
          </span>
          <span className="nb-id">
            <span className="nb-name">{profile.name}</span>
            {profile.role && <span className="nb-role">{profile.role}</span>}
          </span>
        </header>

        <main>
          <section aria-label="Intro" className="nb-intro">
            <h1 className="nb-h1 hs-rise">{profile.headline}</h1>
            {profile.intro && <p className="nb-lede hs-rise-2">{profile.intro}</p>}
            {profile.now && (
              <p className="nb-now hs-rise-2">
                <span aria-hidden="true" className="nb-dot" />
                <span>
                  <NowLine text={profile.now} names={showProjects ? names : []} linkClass="nb-inline-link" />
                </span>
              </p>
            )}
            {site.links.length > 0 && (
              <nav aria-label="Links" className="nb-links hs-rise-3">
                {site.links.map((l, i) => (
                  <a key={`${i}-${l.label}`} href={l.href} className="nb-pill hs-lift">
                    {l.label} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </nav>
            )}
          </section>

          {(showProjects || showEarlier) && (
            <section id="work" aria-label={showProjects ? LABELS.projects : LABELS.earlier}>
              <h2 className="nb-h2">{showProjects ? LABELS.projects : LABELS.earlier}</h2>
              {showProjects && (
                <div className="nb-tiles">
                  {site.projects.map((p, i) => (
                    <article key={`${i}-${p.name}`} className="nb-tile hs-lift">
                      <ProjectMedia project={p} className="nb-media" phoneClass="nb-clip" />
                      <div className="nb-tile-body">
                        <div className="nb-tile-top">
                          <h3 className="nb-tile-name">{p.name}</h3>
                          {p.liveHref && (
                            <a href={p.liveHref} aria-label={`Open ${p.name}`} className="nb-open">
                              ↗
                            </a>
                          )}
                        </div>
                        {p.tag && <p className="nb-tag">{p.tag}</p>}
                        {p.one && <p className="nb-one">{p.one}</p>}
                        {p.stack.length > 0 && (
                          <div className="nb-chips">
                            {p.stack.map((s, j) => (
                              <span key={`${j}-${s}`} className="nb-chip">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {showEarlier && (
                <>
                  {showProjects && <h3 className="nb-sub nb-sub-earlier">{LABELS.earlier}</h3>}
                  <ul className="nb-list">
                    {site.earlier.map((e, i) => {
                      const body = (
                        <>
                          <span className="nb-earlier-top">
                            <span className="nb-earlier-name">{e.name}</span>
                            {(e.meta || e.href) && (
                              <span className="nb-earlier-meta">
                                {e.meta}
                                {e.href ? " ↗" : ""}
                              </span>
                            )}
                          </span>
                          {e.what && <span className="nb-earlier-what">{e.what}</span>}
                        </>
                      );
                      return (
                        <li key={`${i}-${e.name}`}>
                          {e.href ? (
                            <a href={e.href} className="nb-earlier">
                              {body}
                            </a>
                          ) : (
                            <div className="nb-earlier">{body}</div>
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
            <section id="about" aria-label={showAbout ? LABELS.about : LABELS.experience}>
              <h2 className="nb-h2">{showAbout ? LABELS.about : LABELS.experience}</h2>
              {showAbout && (
                <div className="nb-about">
                  <Paragraphs text={profile.about} />
                </div>
              )}
              {showExperience && (
                <>
                  {showAbout && <h3 className="nb-sub nb-sub-exp">{LABELS.experience}</h3>}
                  <ol className="nb-list">
                    {site.experience.map((x, i) => (
                      <li key={`${i}-${x.org}`} className="nb-exp">
                        <div className="nb-exp-main">
                          <span className="nb-org">{x.org}</span>
                          {x.role && <span className="nb-exp-role">{x.role}</span>}
                          {x.what && <span className="nb-exp-what">{x.what}</span>}
                        </div>
                        {x.when && <span className="nb-when">{x.when}</span>}
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </section>
          )}

          {show.has("stack") && site.stack.length > 0 && (
            <section aria-label={LABELS.stack}>
              <h2 className="nb-h2">{LABELS.stack}</h2>
              <dl className="nb-stack">
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
            <section id="contact" aria-label={LABELS.contact}>
              <h2 className="nb-h2">{LABELS.contact}</h2>
              <div className="nb-contact">
                {profile.contactLine && <p>{profile.contactLine}</p>}
                <div className="nb-actions">
                  <a href={`mailto:${profile.email}`} className="nb-btn hs-lift">
                    Email me <span aria-hidden="true">→</span>
                  </a>
                  {linkedIn && (
                    <a href={linkedIn.href} className="nb-btn nb-btn-ghost hs-lift">
                      {linkedIn.label}
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="nb-footer">
          <span>{footer.left}</span>
          <span>{footer.right}</span>
        </footer>
      </div>
    </div>
  );
}
