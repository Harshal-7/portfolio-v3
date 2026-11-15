"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Makes a bulb invite a click: it sways while the pointer is near it (mouse and
 * trackpad only), and gives one small nudge a moment after the page loads so
 * phone visitors notice it too. CSS does the actual motion and skips it for
 * people who prefer reduced motion.
 */
export function useCuriousBulb(ref: RefObject<HTMLElement | null>, radius = 150) {
  const [near, setNear] = useState(false);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let wasNear = false;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        const isNear = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < radius;
        if (isNear !== wasNear) {
          wasNear = isNear;
          setNear(isNear);
        }
      });
    };
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (finePointer) window.addEventListener("pointermove", onMove, { passive: true });
    const timer = window.setTimeout(() => setNudge(true), 2500);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [ref, radius]);

  return {
    /** For the bulb button's data-near / data-nudge attributes. */
    near,
    nudge: nudge && !near,
    stopNudge: () => setNudge(false),
  };
}
