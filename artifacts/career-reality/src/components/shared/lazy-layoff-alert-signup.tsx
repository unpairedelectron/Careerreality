import { lazy, Suspense, useEffect, useRef, useState } from "react";

const LayoffAlertSignup = lazy(() =>
  import("./layoff-alert-signup").then((module) => ({ default: module.LayoffAlertSignup })),
);

export function LazyLayoffAlertSignup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {shouldLoad && (
        <Suspense fallback={<div className="min-h-64" aria-hidden="true" />}>
          <LayoffAlertSignup />
        </Suspense>
      )}
    </div>
  );
}
