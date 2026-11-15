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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => undefined);
        else video.pause();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
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
