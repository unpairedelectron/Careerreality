import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, Check, CircleHelp, ShieldAlert } from "lucide-react";
import { Link } from "@/components/shared/app-link";
import { AppNav } from "@/components/shared/app-nav";
import { useHomeSeo } from "@/lib/home-seo";
import "./home.css";

const HomeBelowFold = lazy(() => import("./home-below-fold"));

function HomeBelowFoldGate() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const reveal = () => {
      if (active) setLoaded(true);
    };
    const onHashChange = () => {
      if (window.location.hash === "#start-here") reveal();
    };
    window.addEventListener("hashchange", onHashChange);

    const target = document.querySelector("[data-home-below-fold]");
    let observer: IntersectionObserver | undefined;
    if (target && "IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer?.disconnect();
        }
      });
      observer.observe(target);
    } else reveal();

    return () => {
      active = false;
      window.removeEventListener("hashchange", onHashChange);
      observer?.disconnect();
    };
  }, []);

  const placeholder = <div aria-hidden="true" style={{ minHeight: "220vh" }} />;
  return (
    <div data-home-below-fold data-testid="home-below-fold-trigger">
      {loaded
        ? <Suspense fallback={placeholder}><HomeBelowFold /></Suspense>
        : placeholder}
    </div>
  );
}

export default function Home() {
  useHomeSeo();

  return (
    <div className="home-page">
      <AppNav />
      <main>
        <section className="home-opening home-opening-layered" aria-labelledby="home-title">
          <div className="home-opening-inner">
            <div className="home-kicker"><span /> Career decisions, in context</div>
            <div className="home-hero-grid">
              <div className="home-copy">
                <p className="home-overline">Career decisions, in context</p>
                <h1 id="home-title">Make your next move<br />make sense.</h1>
                <p className="home-deck">
                  CareerReality helps Indian professionals look beyond an offer headline—at money, the work, the evidence, and the life around it. Start with what you can check.
                </p>
                <a className="home-text-link" href="#start-here">
                  Start with what you can check <ArrowDown size={15} aria-hidden="true" />
                </a>
                <Link href="/layoffs/" className="home-layoff-link" data-testid="link-home-layoff-hub">
                  Facing a layoff? Open the Layoff Hub <ShieldAlert size={15} aria-hidden="true" />
                </Link>
              </div>

              <aside className="home-note" aria-label="A way to read an offer">
                <div className="home-note-topline">
                  <span>FIELD NOTE&nbsp; / &nbsp;01</span>
                  <span className="home-note-mark">CR</span>
                </div>
                <p className="home-note-heading">An offer is a set of questions.</p>
                <div className="home-note-list">
                  <div><span>01</span><p>What is the annual CTC?</p><Check size={15} aria-hidden="true" /></div>
                  <div><span>02</span><p>What might reach my account?</p><CircleHelp size={15} aria-hidden="true" /></div>
                  <div><span>03</span><p>What should I clarify next?</p><CircleHelp size={15} aria-hidden="true" /></div>
                </div>
                <div className="home-note-foot"><span>YOUR DECISION</span><span>YOUR QUESTIONS</span></div>
              </aside>
            </div>
            <div className="home-bottom-rule">
              <span>Practical tools. Editorial guides. Your own context.</span>
              <span>India&nbsp; / &nbsp;₹</span>
            </div>
          </div>
        </section>
        <HomeBelowFoldGate />
      </main>
    </div>
  );
}
