function AnalysisLoader({
  repositoryUrl,
  description = "We’re mapping the project structure and preparing your report. This can take a little while for larger repositories.",
  footnote = "Keep this tab open while the analysis runs",
}) {
  return (
    <section className="gs-analysis-screen" aria-live="polite">
      <div className="gs-analysis-card">
        <div className="gs-analysis-visual" aria-hidden="true">
          <div className="gs-analysis-orbit gs-analysis-orbit-outer" />
          <div className="gs-analysis-orbit gs-analysis-orbit-inner" />
          <div className="gs-analysis-core">
            <svg viewBox="0 0 24 24">
              <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6s-1.2-.4-3.8 1.4a13 13 0 0 0-6.9 0C5.4 1.2 4.2 1.6 4.2 1.6a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.1 6.4 6.1 6.7a3.4 3.4 0 0 0-.9 2.6V22" />
            </svg>
          </div>
          <span className="gs-analysis-particle gs-particle-one" />
          <span className="gs-analysis-particle gs-particle-two" />
          <span className="gs-analysis-particle gs-particle-three" />
        </div>

        <span className="gs-analysis-kicker">
          <i />
          REPOSITORY ANALYSIS
        </span>
        <h1>Getting to know the code.</h1>
        <p className="gs-analysis-description">{description}</p>
        {repositoryUrl && (
          <p className="gs-analysis-url" title={repositoryUrl}>
            {repositoryUrl}
          </p>
        )}
        <div className="gs-analysis-loading-line" aria-hidden="true">
          <span />
        </div>
        <p className="gs-analysis-footnote">{footnote}</p>
      </div>
    </section>
  );
}

export default AnalysisLoader;
