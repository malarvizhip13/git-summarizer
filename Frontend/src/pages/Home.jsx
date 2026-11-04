import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const features = [
  {
    number: "01",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3.75h7l4.25 4.5v12H7a2 2 0 0 1-2-2v-12a2.5 2.5 0 0 1 2-2.5Z" />
        <path d="M14 4v5h4M8.5 13h7M8.5 16.5h7" />
      </svg>
    ),
    title: "A useful overview",
    description:
      "Get the context you need to understand what a project does and how it fits together.",
  },
  {
    number: "02",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-11-4 14" />
      </svg>
    ),
    title: "Technology at a glance",
    description:
      "See the languages, frameworks, and tools that make up the repository.",
  },
  {
    number: "03",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19.25h16M6.5 16V9.5m5 6.5V5m5 11V12" />
        <path d="M4 4.75h16v14.5H4z" />
      </svg>
    ),
    title: "Details that matter",
    description:
      "Explore key features, prerequisites, and technical insights in one clear report.",
  },
];

function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAnalyze = (event) => {
    event.preventDefault();

    const url = repoUrl.trim();
    const githubUrlPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i;

    if (!url) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    if (!githubUrlPattern.test(url)) {
      setError("Please enter a valid public GitHub repository URL.");
      return;
    }

    setError("");
    navigate("/analyze", { state: { repoUrl: url } });
  };

  return (
    <>
      <section className="gs-hero">
        <div className="gs-hero-grid" aria-hidden="true" />
        <div className="gs-hero-inner">
          <div className="gs-hero-copy">
            <div className="gs-eyebrow">
              <span className="gs-eyebrow-dot" />
              A clearer view of any codebase
            </div>

            <h1>
              Make sense of
              <br />
              <span>any repository.</span>
            </h1>

            <p className="gs-hero-description">
              Turn a GitHub link into a thoughtful, easy-to-read guide to the
              project, its technologies, and how it all fits together.
            </p>

            <form onSubmit={handleAnalyze} className="gs-repo-form">
              <label className="gs-sr-only" htmlFor="repository-url">
                GitHub repository URL
              </label>
              <div className="gs-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6s-1.2-.4-3.8 1.4a13 13 0 0 0-6.9 0C5.4 1.2 4.2 1.6 4.2 1.6a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.1 6.4 6.1 6.7a3.4 3.4 0 0 0-.9 2.6V22" />
                </svg>
                <input
                  id="repository-url"
                  type="url"
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder="https://github.com/owner/repository"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "repository-error" : undefined}
                />
                <button type="submit" className="gs-button gs-button-primary">
                  Explore repository
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4 10h12m-5-5 5 5-5 5" />
                  </svg>
                </button>
              </div>
              {error ? (
                <p id="repository-error" role="alert" className="gs-form-note gs-form-error">
                  {error}
                </p>
              ) : (
                <p className="gs-form-note">
                  <span className="gs-lock-icon" aria-hidden="true">↗</span>
                  Analyze any public repository — save it later if you choose
                </p>
              )}
            </form>

            <div className="gs-hero-meta">
              <span><span className="gs-meta-check">✓</span> No setup required</span>
              <span><span className="gs-meta-check">✓</span> Clear, structured insights</span>
            </div>
          </div>

          <div className="gs-preview-wrap" aria-label="Example repository analysis">
            <div className="gs-preview-orbit gs-orbit-one" />
            <div className="gs-preview-orbit gs-orbit-two" />
            <div className="gs-preview-card">
              <div className="gs-preview-topbar">
                <div className="gs-window-dots" aria-hidden="true">
                  <i /><i /><i />
                </div>
                <span>REPOSITORY BRIEF</span>
                <span className="gs-preview-live"><i /> READY</span>
              </div>
              <div className="gs-preview-content">
                <div className="gs-preview-repo">
                  <div className="gs-repo-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6s-1.2-.4-3.8 1.4a13 13 0 0 0-6.9 0C5.4 1.2 4.2 1.6 4.2 1.6a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.1 6.4 6.1 6.7a3.4 3.4 0 0 0-.9 2.6V22" />
                    </svg>
                  </div>
                  <div>
                    <span className="gs-preview-label">GITHUB REPOSITORY</span>
                    <h2>acme / launchpad</h2>
                  </div>
                  <span className="gs-public-badge">Public</span>
                </div>

                <div className="gs-preview-summary">
                  <div className="gs-summary-heading">
                    <span className="gs-summary-spark">✳</span>
                    <span>PROJECT OVERVIEW</span>
                  </div>
                  <p>
                    A modern toolkit for building and shipping web applications,
                    with a focus on speed, simplicity, and developer experience.
                  </p>
                </div>

                <div className="gs-preview-divider" />

                <div className="gs-preview-lower">
                  <div className="gs-tech-block">
                    <span className="gs-preview-label">TECHNOLOGIES</span>
                    <div className="gs-tech-tags">
                      <span><i className="gs-tech-js" /> JavaScript</span>
                      <span><i className="gs-tech-react" /> React</span>
                      <span><i className="gs-tech-node" /> Node.js</span>
                    </div>
                  </div>
                  <div className="gs-file-block">
                    <span className="gs-preview-label">PROJECT SHAPE</span>
                    <div className="gs-file-tree">
                      <span><i className="gs-folder-dot" /> src/</span>
                      <span><i className="gs-file-dot" /> components</span>
                      <span><i className="gs-file-dot" /> package.json</span>
                    </div>
                  </div>
                </div>

                <div className="gs-preview-footer">
                  <span><i /> ANALYSIS COMPLETE</span>
                  <span>REPORT <b>↗</b></span>
                </div>
              </div>
            </div>
            <div className="gs-floating-note">
              <span className="gs-floating-icon">✳</span>
              <span><b>Less digging.</b><br />More understanding.</span>
            </div>
          </div>
        </div>
        <div className="gs-hero-bottom">
          <span>BUILT FOR THE CURIOUS DEVELOPER</span>
          <span className="gs-scroll-line" />
          <span>SCROLL TO EXPLORE</span>
        </div>
      </section>

      <section className="gs-features" id="features">
        <div className="gs-section-inner">
          <div className="gs-section-heading">
            <div>
              <span className="gs-section-kicker">FROM LINK TO CLARITY</span>
              <h2>Get the whole picture,<br />without the deep dive.</h2>
            </div>
            <p>
              New to a codebase or just short on time? GitSummarizer surfaces
              the details worth knowing, all in one place.
            </p>
          </div>

          <div className="gs-feature-grid">
            {features.map((feature) => (
              <article className="gs-feature-card" key={feature.title}>
                <div className="gs-feature-card-top">
                  <span className="gs-feature-icon">{feature.icon}</span>
                  <span className="gs-feature-number">{feature.number}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="gs-feature-arrow" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gs-cta">
        <div className="gs-cta-inner">
          <div>
            <span className="gs-section-kicker">YOUR NEXT REPOSITORY, EXPLAINED</span>
            <h2>Curiosity starts with a link.</h2>
            <p>Get a clearer picture of your next project in just a few clicks.</p>
          </div>
          <Link to="/dashboard" className="gs-button gs-button-light">
            Go to your dashboard
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h12m-5-5 5 5-5 5" />
            </svg>
          </Link>
        </div>
        <div className="gs-cta-decoration" aria-hidden="true">G</div>
      </section>
    </>
  );
}

export default Home;
