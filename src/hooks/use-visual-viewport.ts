"use client";

import { useEffect, type RefObject } from "react";

// Mobile browsers may shrink only the visual viewport when the keyboard opens.
export function useVisualViewport(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let frame = 0;
    const update = () => {
      const element = ref.current;
      if (!element) return;
      if (window.innerWidth < 1024) {
        element.style.height = `${viewport.height}px`;
        element.style.position = "fixed";
        element.style.top = `${viewport.offsetTop}px`;
        element.style.left = "0";
        element.style.right = "0";
      } else {
        for (const property of ["height", "position", "top", "left", "right"]) element.style.removeProperty(property);
      }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    viewport.addEventListener("resize", schedule);
    viewport.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", schedule);
      viewport.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);
}
