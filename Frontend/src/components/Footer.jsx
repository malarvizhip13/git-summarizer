import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="gs-site-footer">
      <div className="gs-footer-main">
        <div>
          <Link to="/" className="gs-brand gs-footer-brand">
            <span className="gs-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 18V6l7 7 7-7v12" />
                <path d="M5 18h14" />
              </svg>
            </span>
          GitSummarizer
          </Link>
          <p className="gs-footer-tagline">A clearer view of every codebase.</p>
        </div>

        <div className="gs-footer-links">
          <Link to="/features">
            Features
          </Link>
          <Link to="/about">
            About
          </Link>
          <Link to="/history">
            History
          </Link>
        </div>
      </div>

      <div className="gs-footer-bottom">
        <span>© {new Date().getFullYear()} GitSummarizer</span>
        <span>Made for exploring what code can do.</span>
      </div>
    </footer>
  );
}

export default Footer;