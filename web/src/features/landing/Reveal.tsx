import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Element to render; defaults to `div`. */
  as?: ElementType;
  /** Stagger delay in ms, applied when the element enters the viewport. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Fades and lifts its content in the first time it scrolls into view.
 * Styling lives in `.reveal` (index.css); reduced-motion users get a plain fade.
 */
export function Reveal({ children, as: Tag = "div", delay = 0, className = "", style }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-revealed={shown ? "" : undefined}
      className={`reveal ${className}`}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
