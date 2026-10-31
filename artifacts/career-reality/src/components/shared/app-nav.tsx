import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, Menu, Moon, Search, Sun, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { primaryRoutes, searchRoute, ctcCalculatorRoute } from "@/data/navigation-routes";
import { useAppAuth } from "@/lib/app-auth-context";
import { useTheme } from "@/lib/theme";
import "./public-chrome.css";

export function Logo() {
  return (
    <Link href="/" className="cr-brand" data-testid="link-logo" aria-label="CareerReality home">
      <span className="cr-brand-mark" aria-hidden="true">CR</span>
      <span className="cr-brand-name">Career<span>Reality</span></span>
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="cr-icon-button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      data-testid="button-theme-toggle"
    >
      {isDark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
    </button>
  );
}

function primaryRouteLabel(path: string, title: string): string {
  return path.replace(/\/+$/, "") === "/companies" ? "Employer check" : title;
}

export function AppNav() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const { user, signOut, isSignedIn } = useAppAuth();

  useEffect(() => {
    if (!open) return;
    mobileNavigationRef.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [open]);

  const closeMobileMenu = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  const isCurrent = (path: string) => location === path || location === `${path}/` || location.startsWith(`${path}/`);
  const accountLabel = user?.firstName || user?.fullName || "Account";

  return (
    <header className="cr-nav-shell">
      <div className="cr-nav">
        <Logo />
        <nav className="cr-primary-nav" aria-label="Primary navigation">
          {primaryRoutes.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              aria-current={isCurrent(route.path) ? "page" : undefined}
              className={`cr-nav-link${isCurrent(route.path) ? " is-current" : ""}`}
              data-testid={`link-primary-${route.path.replaceAll("/", "-")}`}
            >
              {primaryRouteLabel(route.path, route.title)}
            </Link>
          ))}
        </nav>
        <div className="cr-nav-actions">
          {searchRoute && (
            <Link href={searchRoute.path} className="cr-icon-button" aria-label="Search CareerReality" title="Search" data-testid="button-search">
              <Search size={15} aria-hidden="true" />
            </Link>
          )}
          <ThemeToggle />
          {!isSignedIn ? (
            <>
              <Link href="/sign-in" className="cr-sign-in" data-testid="link-sign-in">Sign in</Link>
              {ctcCalculatorRoute && (
                <Link href={ctcCalculatorRoute.path} className="cr-nav-cta" data-testid="link-start-reading">
                  Read your offer <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              )}
            </>
          ) : (
            <div className="cr-account">
              {ctcCalculatorRoute && <Link href={ctcCalculatorRoute.path} className="cr-nav-cta" data-testid="link-start-reading-auth">Read your offer <ArrowUpRight size={14} aria-hidden="true" /></Link>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="cr-account-button" aria-label="Account menu" data-testid="button-account-menu">
                    {user?.imageUrl ? <img src={user.imageUrl} alt="" /> : <span aria-hidden="true">{accountLabel.slice(0, 1).toUpperCase()}</span>}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={10} className="w-56 rounded-xl border-border bg-popover p-1.5 shadow-xl">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold">{user?.fullName || accountLabel}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/workspace" className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold" data-testid="link-workspace">Your workspace</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void signOut({ redirectUrl: "/" })} className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold">Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) closeMobileMenu();
          }}
          className="cr-mobile-toggle"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          data-testid="button-mobile-menu"
        >
          {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <div
          ref={mobileNavigationRef}
          id="mobile-navigation"
          className="cr-mobile-panel"
          onKeyDown={(event) => {
            if (event.key === "Escape") closeMobileMenu();
          }}
        >
          <nav aria-label="Mobile navigation">
            <p className="cr-mobile-label">Explore CareerReality</p>
            {primaryRoutes.map((route) => (
              <Link key={route.path} onClick={() => setOpen(false)} href={route.path} className="cr-mobile-link" aria-current={isCurrent(route.path) ? "page" : undefined}>
                {primaryRouteLabel(route.path, route.title)}<ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            ))}
            {searchRoute && <Link onClick={() => setOpen(false)} href={searchRoute.path} className="cr-mobile-link"><Search size={15} aria-hidden="true" />Search</Link>}
            {isSignedIn ? (
              <>
                <Link onClick={() => setOpen(false)} href="/workspace" className="cr-mobile-link">Your workspace</Link>
                <button type="button" onClick={() => { setOpen(false); void signOut({ redirectUrl: "/" }); }} className="cr-mobile-link">Sign out</button>
              </>
            ) : (
              <Link onClick={() => setOpen(false)} href="/sign-in" className="cr-mobile-link">Sign in</Link>
            )}
            <div className="cr-mobile-appearance"><span>Appearance</span><ThemeToggle /></div>
          </nav>
        </div>
      )}
    </header>
  );
}
