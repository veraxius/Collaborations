"use client";

import { useEffect, useRef } from "react";

/**
 * Subtle liquid-glass ambient background. No visible shapes or bubbles:
 * heavily-blurred color fields with slowly morphing organic silhouettes,
 * and a seamless full-viewport gradient layer whose light center lazily
 * follows the cursor. Everything is edge-free — the interactivity reads as
 * light shifting through glass, not as an object chasing the mouse.
 * Pure decoration: fixed, behind everything, ignores pointer events.
 */
export function AmbientBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let targetX = 0.5;
    let targetY = 0.35;
    let x = targetX;
    let y = targetY;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth;
      targetY = e.clientY / window.innerHeight;
    };

    const tick = () => {
      // Lazy follow: close only a fraction of the distance per frame.
      x += (targetX - x) * 0.04;
      y += (targetY - y) * 0.04;
      root.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
      root.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ "--mx": "50%", "--my": "35%" } as React.CSSProperties}
    >
      {/* Slowly morphing, heavily blurred liquid color fields */}
      <div className="liquid-blob liquid-blob-a" />
      <div className="liquid-blob liquid-blob-b" />
      <div className="liquid-blob liquid-blob-c" />
      {/* Seamless cursor-reactive light layer (full viewport, no edges) */}
      <div className="liquid-light" />
      {/* Fine glass grain so the gradients don't band */}
      <div className="liquid-grain" />
    </div>
  );
}
