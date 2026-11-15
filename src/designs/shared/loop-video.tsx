"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * A silent looping clip, used like a GIF but far smaller. It only downloads and
 * plays while it's on screen, pauses when scrolled away, and stays on its still
 * poster for people who prefer reduced motion.
 */
export function LoopVideo(props: {
  mp4: string;
  webm: string;
  poster: string;
  label: string;
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.muted = true;
    let onScreen = false;
    // Play whenever the clip is on screen and the tab is visible. Retried when the
    // tab comes back to the front and when enough of the clip has loaded, since a
    // play() made in a background tab or before loading can be ignored.
    const tryPlay = () => {
      if (onScreen && document.visibilityState === "visible" && video.paused) video.play().catch(() => undefined);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) tryPlay();
        else video.pause();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", tryPlay);
    video.addEventListener("canplay", tryPlay);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={props.className}
      style={props.style}
      width={props.width}
      height={props.height}
      poster={props.poster}
      aria-label={props.label}
      muted
      loop
      playsInline
      preload="none"
    >
      <source src={props.webm} type="video/webm" />
      <source src={props.mp4} type="video/mp4" />
    </video>
  );
}
