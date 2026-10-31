import { Link } from "wouter";
import { Logo } from "@/components/shared/app-nav";
import { publicSiteMap } from "@/data/site-map";
import "./public-chrome.css";

export function PublicFooter() {
  return (
    <footer className="cr-public-footer">
      <div className="cr-footer-main">
        <div className="cr-footer-identity">
          <svg className="cr-footer-illustration" viewBox="0 0 320 210" aria-hidden="true">
            <path d="M27 177c34-37 63-50 98-39 31 10 40 39 76 35 29-3 47-21 92-8v33H27z" fill="#dce8df" />
            <path d="M27 191c47-27 80-22 112-10 41 15 72 12 154-10v37H27z" fill="#c5d9ce" />
            <circle cx="235" cy="52" r="27" fill="#e9d9b7" />
            <path d="M75 158c23-9 42-9 65-3 21 6 31 12 48 7 17-5 24-19 44-19" fill="none" stroke="#b9864f" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 13" />
            <path d="M160 154c-2-18 1-33 8-46" fill="none" stroke="#1f716a" strokeWidth="5" strokeLinecap="round" />
            <path d="M166 122c-20 0-30-10-30-26 17 0 29 8 30 26Z" fill="#1f716a" />
            <path d="M166 112c1-19 13-29 30-28 0 17-11 28-30 28Z" fill="#3f9180" />
            <path d="M166 96c-13-8-15-21-7-34 13 8 17 20 7 34Z" fill="#76a88e" />
            <path d="M159 156c-14-10-25-8-33 4 12 10 25 9 33-4Z" fill="#8eae94" />
            <path d="M172 148c13-12 25-12 35-2-10 13-23 15-35 2Z" fill="#5e9a80" />
            <path d="M57 84h18m-9-9v18M268 113h14m-7-7v14" stroke="#1f716a" strokeWidth="2" strokeLinecap="round" opacity=".7" />
            <circle cx="103" cy="63" r="3" fill="#b9864f" />
            <circle cx="250" cy="145" r="3" fill="#b9864f" />
          </svg>
          <Logo />
          <p className="cr-footer-pun">Don’t leaf your next move to chance.</p>
          <span className="cr-footer-tagline">Rooted in evidence. Growing on your terms.</span>
          <span className="cr-footer-place">A career desk for India&nbsp; / &nbsp;₹</span>
        </div>
        <nav aria-label="Public CareerReality navigation" className="cr-footer-directory">
          {publicSiteMap.map((section) => (
            <section key={section.label} className="cr-footer-directory-section" data-section={section.label.toLowerCase()}>
              <h2 className="cr-footer-directory-heading">{section.label}</h2>
              <ul className="cr-footer-directory-links">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="cr-footer-directory-link">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
      <div className="cr-footer-bottom">
        <span>© 2026 CareerReality&nbsp; / &nbsp;India</span>
        <span>Useful evidence. Human judgment.</span>
      </div>
      <p className="cr-footer-disclaimer">CareerReality provides educational tools and editorial guidance, not individual legal, tax, or financial advice.</p>
    </footer>
  );
}
