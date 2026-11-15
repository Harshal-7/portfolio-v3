"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Makes a bulb invite a click: it sways while the pointer is near it (mouse and
 * trackpad only), and gives one small nudge a moment after the page loads so
 * phone visitors notice it too. When the pointer leaves, the current swing
 * finishes before it stops, so it never snaps back mid-swing. CSS does the
 * motion and skips it for people who prefer reduced motion.
 */
export function useCuriousBulb(ref: RefObject<HTMLElement | null>, radius = 220) {
  const [swinging, setSwinging] = useState(false);
  const [nudge, setNudge] = useState(false);
  const near = useRef(false);
  // Someone who already hovered the bulb has noticed it: skip the nudge.
  const noticed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        const isNear = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < radius;
        near.current = isNear;
        if (isNear) {
          noticed.current = true;
          setNudge(false);
          setSwinging(true);
        }
      });
    };
    // A swing cycle ends back at the centre: stop there if the pointer has left.
    const onCycle = (e: AnimationEvent) => {
      const main = e.target === el || (e.target as Element).classList.contains("nb-bulb-hang");
      if (main && /Sway$/.test(e.animationName) && !near.current) setSwinging(false);
    };
    // Leaving the window sends no more moves, so treat it as leaving the zone.
    const onLeave = () => {
      near.current = false;
    };
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (finePointer) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }
    el.addEventListener("animationiteration", onCycle);
    const timer = window.setTimeout(() => {
      if (!noticed.current) setNudge(true);
    }, 2500);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("animationiteration", onCycle);
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [ref, radius]);

  return {
    /** For the bulb button's data-near / data-nudge attributes. */
    near: swinging,
    nudge: nudge && !swinging,
    stopNudge: () => setNudge(false),
  };
}
