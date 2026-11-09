import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { Link } from "@/components/shared/app-link";
import { AppNav } from "@/components/shared/app-nav";
import { PublicFooter } from "@/components/shared/public-footer";
import { guideRoutes, toolRoutes } from "@/data/public-routes";
import { getToolDirectoryCategoryLabel, toolDirectoryCategories, toolDirectoryItems } from "@/data/tool-directory";
import { useSeo } from "@/lib/seo";
import { getPageHeading } from "@/data/page-headings";
import "./public-hubs.css";

function RouteIndex({
  kind,
  routes,
}: {
  kind: "tools" | "guides";
  routes: typeof toolRoutes | typeof guideRoutes;
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | (typeof toolDirectoryCategories)[number]["id"]>("all");
  const guides = kind === "guides";
  const pageHeading = getPageHeading(guides ? "/guides" : "/tools");
  const title = pageHeading?.subhead ?? (guides ? "Guides for the questions behind the move." : "Tools for the parts you can check.");
  const intro = guides
    ? "Practical reading for compensation, career changes, engineering work, layoffs, and workplace decisions, with clear limits on what each page can establish."
    : "Compare written offers, estimate take-home pay, map job-posting requirements to resume evidence, or organize a career decision. Every tool shows its inputs and limits.";
  const filteredRoutes = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const sourceRoutes = guides
      ? routes
      : toolDirectoryItems
        .filter((item) => selectedCategory === "all" || item.category === selectedCategory)
        .map((item) => item.route);
    if (!needle) return sourceRoutes;
    return sourceRoutes.filter((route) => {
      const directoryItem = toolDirectoryItems.find((item) => item.route.path === route.path);
      return `${route.title} ${route.description} ${directoryItem?.customerQuestion ?? ""} ${directoryItem ? getToolDirectoryCategoryLabel(directoryItem.category) : ""}`
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [guides, query, routes, selectedCategory]);

  useSeo({
    title: guides ? "Career Guides for India | CareerReality" : "Career Tools for India | CareerReality",
    description: guides
      ? "Browse practical editorial guides on compensation, career changes, engineering work, layoffs, and workplace decisions."
      : "Compare offers, plan cash flow, and work through career decisions with transparent calculations and clear limits.",
    path: guides ? "/guides" : "/tools",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: guides ? "Career Guides for India" : "Career Tools for India", path: guides ? "/guides" : "/tools" },
    ],
  });

  const featured = !guides && selectedCategory === "all" && !query.trim()
    ? filteredRoutes.find((route) => route.toolId === "offer-comparison")
    : undefined;
  const listRoutes = featured ? filteredRoutes.filter((route) => route.path !== featured.path) : filteredRoutes;

  return (
    <div className="directory-page">
      <AppNav />
      <main className="directory-main">
        <header className="directory-intro">
          <div className="directory-eyebrow"><span /> CareerReality / {guides ? "Reading room" : "Working desk"}</div>
          <div className="directory-title-row">
            <div>
              <h1 className="directory-keyword-title">{pageHeading?.h1 ?? title}</h1>
              <p className="directory-display" data-testid="page-subhead">{title}</p>
              <p>{intro}</p>
            </div>
            <div className="directory-index-mark" aria-hidden="true">
              <span>{guides ? "READ" : "USE"}</span>
              <strong>{String(routes.length).padStart(2, "0")}</strong>
              <span>REGISTERED</span>
            </div>
          </div>
          <div className="directory-underbar">
            <span>Made for decisions that stay yours</span>
            <a href="#directory-list">Browse the {guides ? "guides" : "tools"} <ArrowDownRight size={14} aria-hidden="true" /></a>
          </div>
        </header>

        {!guides && featured && (
          <section className="directory-featured" aria-labelledby="directory-featured-title">
            <div className="directory-featured-meta"><span>START HERE</span><span>01 / COMPARE A WRITTEN OFFER</span></div>
            <div className="directory-featured-copy">
              <div>
                <p className="directory-label">Start with the decision in front of you</p>
                <h2 id="directory-featured-title">{featured.title}</h2>
                <p>{toolDirectoryItems.find((item) => item.route.path === featured.path)?.customerQuestion} {featured.description}</p>
              </div>
              <Link className="directory-featured-link" href={featured.path} data-testid="link-featured-tool">
                Compare offers <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <span className="directory-featured-index" aria-hidden="true">₹</span>
          </section>
        )}

        <section id="directory-list" className="directory-listing" aria-labelledby="directory-list-title">
          <div className="directory-list-heading">
            <div>
              <p className="directory-label">{guides ? "The reading room" : "The working desk"}</p>
              <h2 id="directory-list-title">{guides ? "Choose the question." : "Pick up where you are."}</h2>
            </div>
            <label className="directory-search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Search {guides ? "guides" : "tools"}</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={guides ? "Search the reading room" : "Search the working desk"}
                data-testid={`input-search-${kind}`}
              />
            </label>
          </div>
          {!guides && (
            <div className="directory-categories" role="group" aria-label="Filter tools by customer situation">
              <button
                type="button"
                className={`directory-category ${selectedCategory === "all" ? "is-selected" : ""}`}
                aria-pressed={selectedCategory === "all"}
                onClick={() => setSelectedCategory("all")}
                data-testid="filter-tools-all"
              >
                All tools <span>{toolDirectoryItems.length}</span>
              </button>
              {toolDirectoryCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`directory-category ${selectedCategory === category.id ? "is-selected" : ""}`}
                  aria-pressed={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`filter-tools-${category.id}`}
                >
                  {category.label}
                  <span>{toolDirectoryItems.filter((item) => item.category === category.id).length}</span>
                </button>
              ))}
            </div>
          )}
          <p className="directory-result-count" aria-live="polite">
            <SlidersHorizontal size={13} aria-hidden="true" />
            {filteredRoutes.length} {filteredRoutes.length === 1 ? "result" : "routes"} · {guides ? "current guides" : "prioritized by customer situation"}
          </p>

          {filteredRoutes.length ? (
            <ol className={`directory-rows ${guides ? "directory-rows-guides" : ""}`}>
                {listRoutes.map((route, index) => {
                  const directoryItem = !guides
                    ? toolDirectoryItems.find((item) => item.route.path === route.path)
                    : null;
                  return (
                    <li key={route.path}>
                      <Link className="directory-row" href={route.path} data-testid={`link-directory-${kind}-${route.path.replaceAll("/", "-")}`}>
                        <span className="directory-row-number">{String(index + (featured && !query ? 2 : 1)).padStart(2, "0")}</span>
                        <span className="directory-row-copy">
                          {directoryItem && <span className="directory-row-category">{getToolDirectoryCategoryLabel(directoryItem.category)}</span>}
                          <span className="directory-row-title">{route.title}</span>
                          {directoryItem && <span className="directory-row-question">Use this to: {directoryItem.customerQuestion}</span>}
                          <span className="directory-row-description">{route.description}</span>
                        </span>
                        <span className="directory-row-arrow" aria-hidden="true"><ArrowUpRight size={17} /></span>
                      </Link>
                    </li>
                  );
                })}
            </ol>
          ) : (
            <div className="directory-empty" role="status">
              <p className="directory-label">Nothing in this part of the index</p>
              <h3>Try a different phrase.</h3>
              <p>Search a decision, a subject, or a word from the route description.</p>
              <button type="button" onClick={() => setQuery("")}>Clear search</button>
            </div>
          )}
        </section>

        <aside className="directory-boundary" aria-label="How to use CareerReality">
          <span className="directory-boundary-mark">A NOTE ON THE WORK</span>
          <p>These pages can make the next question clearer. They cannot make the decision for you.</p>
          <span className="directory-boundary-signoff">CAREERREALITY&nbsp; / &nbsp;INDIA</span>
        </aside>
      </main>
      <PublicFooter />
    </div>
  );
}

export function ToolsHubPage() {
  return <RouteIndex kind="tools" routes={toolRoutes} />;
}

export function GuidesHubPage() {
  return <RouteIndex kind="guides" routes={guideRoutes} />;
}
