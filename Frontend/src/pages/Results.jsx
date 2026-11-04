import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import { useAuth } from "../context/useAuth";
import {
  getAnalysisById,
  getRepositoryById,
  saveAnalysisToAccount,
} from "../services/api";

// =========================================================
// HELPERS
// =========================================================

const getArray = (value) => (Array.isArray(value) ? value : []);

const normalizeLanguages = (languages) => {
  if (!Array.isArray(languages)) {
    return [];
  }

  return languages
    .map((item) => {
      if (typeof item !== "string") {
        return item;
      }

      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    })
    .filter(
      (item) =>
        item &&
        typeof item.language === "string" &&
        Number.isFinite(Number(item.percentage))
    );
};

const downloadJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const getAnalysisData = (result) => {
  if (!result || typeof result !== "object") return {};

  // Supports both persisted and direct API analysis structures.
  return result.analysis || result.staticAnalysis || result;
};

const getAiSummary = (result) => {
  if (!result || typeof result !== "object") return null;

  return result.aiSummary || result.ai_summary || null;
};



const getAiStatus = (aiSummary) => {
  if (!aiSummary) return "unavailable";

  if (aiSummary.status) return aiSummary.status;

  if (aiSummary.isComplete) return "completed";

  if (aiSummary.summary) return "incomplete";

  return "failed";
};

// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({ status }) {
  const styles = {
    completed: "bg-green-100 text-green-700",
    incomplete: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    unavailable: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.unavailable
      }`}
    >
      {status}
    </span>
  );
}

// =========================================================
// RESULTS PAGE
// =========================================================

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { analysisId } = useParams();

  const [savedAnalysis, setSavedAnalysis] = useState(null);
  const [savedRepository, setSavedRepository] = useState(null);
  const [loadedAnalysisId, setLoadedAnalysisId] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [savingRepository, setSavingRepository] = useState(false);
  const [saveMessage, setSaveMessage] = useState(
    location.state?.saveMessage || ""
  );
  const [saveError, setSaveError] = useState("");

  // =======================================================
  // LOAD SAVED ANALYSIS
  // =======================================================

  useEffect(() => {
    if (!analysisId) return;

    let cancelled = false;

    const loadSavedAnalysis = async () => {
      try {
        setError("");
        setSavedAnalysis(null);
        setSavedRepository(null);
        setLoadedAnalysisId(null);

        const response = await getAnalysisById(analysisId);
        const record = response.analysis;

        if (!record) {
          throw new Error("Analysis record was not found.");
        }

        if (record.status !== "completed") {
          throw new Error(
            `This analysis is currently ${record.status}.`
          );
        }

        const repositoryResponse = await getRepositoryById(
          record.repository_id
        );

        if (cancelled) return;

        setSavedAnalysis(record);
        setSavedRepository(repositoryResponse.repository);
        setLoadedAnalysisId(analysisId);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.message || "Unable to load analysis."
          );
        }
      }
    };

    loadSavedAnalysis();

    return () => {
      cancelled = true;
    };
  }, [analysisId, reloadKey]);

  const retryLoading = useCallback(() => {
    setError("");
    setReloadKey((current) => current + 1);
  }, []);

  const handleDownloadJson = () => {
    if (!savedAnalysis) return;

    const repositoryName =
      savedRepository?.github_name || "repository";
    const safeName = repositoryName.replace(/[^a-z0-9-_]/gi, "-");

    downloadJson(
      {
        analysis: savedAnalysis,
        repository: savedRepository,
      },
      `gitsummarizer-${safeName}-${analysisId || "report"}.json`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveRepository = async () => {
    if (!analysisId || !savedRepository?.id || savingRepository) return;

    setSaveMessage("");
    setSaveError("");

    if (!user) {
      window.sessionStorage.setItem(
        "gitsummarizer-pending-analysis",
        analysisId
      );
      navigate("/login");
      return;
    }

    setSavingRepository(true);

    try {
      const response = await saveAnalysisToAccount(analysisId);
      if (!response.repository?.is_saved) {
        throw new Error("The repository was not marked as saved.");
      }
      if (!response.analysisId) {
        throw new Error("The saved analysis ID was not returned.");
      }

      setSavedRepository(response.repository);
      setSaveMessage("Analysis saved to your dashboard.");
      navigate(
        `/results/${encodeURIComponent(response.analysisId)}`,
        {
          replace: true,
          state: { saveMessage: "Analysis saved to your dashboard." },
        }
      );
    } catch (requestError) {
      setSaveError(requestError.message || "Unable to save analysis.");
    } finally {
      setSavingRepository(false);
    }
  };

  // =======================================================
  // LOADING
  // =======================================================

  const loading = Boolean(
    analysisId && loadedAnalysisId !== analysisId && !error
  );

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Loading Analysis Results
        </h1>

        <p className="mt-3 text-gray-600">
          Retrieving your saved repository analysis.
        </p>
      </section>
    );
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (error) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Unable to Load Analysis
        </h1>

        <p className="mt-4 text-red-600">{error}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={retryLoading}
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Retry
          </button>

          <Link
            to="/history"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Analysis History
          </Link>
        </div>
      </section>
    );
  }

  // =======================================================
  // DATA
  // =======================================================

  const repository = analysisId
    ? savedRepository
    : location.state?.repository;

  const analysisResponse = location.state?.analysisResponse;

  const result = analysisId
    ? savedAnalysis?.analysis_result
    : analysisResponse?.analysis;
  const canSaveAnalysis = Boolean(
    savedRepository &&
      (!user ||
        String(savedRepository.user_id).toLowerCase() !==
          String(user.id).toLowerCase() ||
        !savedRepository.is_saved)
  );

  if (!result) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          No Analysis Results
        </h1>

        <p className="mt-4 text-gray-600">
          Start an analysis from your Repository Dashboard.
        </p>

        <Link
          to="/dashboard"
          className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white"
        >
          Back to Dashboard
        </Link>
      </section>
    );
  }

  const staticAnalysis = getAnalysisData(result);
  const aiSummary = getAiSummary(result);
  const aiStatus = getAiStatus(aiSummary);

  const summary =
    typeof aiSummary?.summary === "string"
      ? aiSummary.summary
      : "";

  const languages = normalizeLanguages(staticAnalysis?.languages);
  const frameworks = getArray(staticAnalysis?.frameworks);
  const technologies = getArray(staticAnalysis?.technologies);

  const retrieval = result.retrieval || {};
  const fileStats = retrieval.files || {};
  const selectionStats = retrieval.selection || {};

  const analyzedFiles =
    fileStats.retrieved ??
    fileStats.success ??
    selectionStats.selected ??
    0;

  const failedFiles = getArray(retrieval.failures).length;

  // =======================================================
  // RESULTS UI
  // =======================================================

  return (
    <main className="min-h-screen bg-slate-50 print:bg-white">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10 print:max-w-none print:px-0 print:py-0">
      {/* HEADER */}
      <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status="completed" />
              <StatusBadge status={aiStatus} />
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
              GitSummarizer / Analysis Report
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Repository Analysis
            </h1>

            <p className="mt-4 break-words text-xl font-semibold text-slate-700">
              {repository?.github_owner}/{repository?.github_name}
            </p>

            {analysisId && (
              <p className="mt-3 break-all text-sm text-slate-500">
                Analysis ID: {analysisId}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            {canSaveAnalysis && (
              <button
                type="button"
                onClick={handleSaveRepository}
                disabled={savingRepository || authLoading}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-yellow-200 bg-yellow-50 px-5 text-base font-semibold text-yellow-800 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authLoading
                  ? "Checking sign-in..."
                  : savingRepository
                    ? "Saving..."
                    : "Save to Dashboard"}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={!savedAnalysis}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
            >
              Download JSON
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
        {(saveMessage || saveError) && (
          <p
            role={saveError ? "alert" : "status"}
            className={`mt-5 text-sm ${saveError ? "text-red-600" : "text-green-700"}`}
          >
            {saveError || saveMessage}
          </p>
        )}
      </div>

      {/* AI STATUS */}
      {aiStatus === "failed" && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-800">
            AI Summary Unavailable
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {aiSummary?.error ||
              "AI summary generation failed. Static analysis is still available."}
          </p>
        </div>
      )}

      {aiStatus === "incomplete" && (
        <div className="mb-8 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <h2 className="font-semibold text-yellow-800">
            Partial AI Summary
          </h2>

          <p className="mt-2 text-sm text-yellow-700">
            The AI returned an incomplete response. The available
            summary is displayed below.
          </p>
        </div>
      )}

      {/* ANALYSIS STATISTICS */}
      <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Languages"
          value={languages.length}
        />

        <MetricCard
          title="Frameworks"
          value={frameworks.length}
        />

        <MetricCard
          title="Technologies"
          value={technologies.length}
        />

        <MetricCard
          title="Files Retrieved"
          value={analyzedFiles}
        />
      </div>

      {/* AI SUMMARY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            AI Repository Summary
          </h2>

          <StatusBadge status={aiStatus} />
        </div>

        {summary ? (
          <article className="prose prose-lg prose-slate mt-7 max-w-none leading-8 sm:prose-xl">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </article>
        ) : (
          <p className="mt-6 text-gray-500">
            No AI summary is available for this analysis.
          </p>
        )}

        {aiSummary?.model && (
          <p className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-500">
            Model: {aiSummary.model}
          </p>
        )}
      </div>

      {/* TECHNOLOGIES */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <LanguageCard languages={languages} />
        <InfoCard title="Frameworks" items={frameworks} />
        <InfoCard title="Technologies" items={technologies} />
      </div>

      {/* RETRIEVAL DETAILS */}
      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-gray-900">
          Repository Retrieval
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail
            label="Repository Files"
            value={selectionStats.available ?? "Unavailable"}
          />

          <Detail
            label="Selected Files"
            value={selectionStats.selected ?? "Unavailable"}
          />

          <Detail
            label="Retrieved Files"
            value={analyzedFiles}
          />

          <Detail
            label="Failed File Retrievals"
            value={failedFiles}
          />

          <Detail
            label="Analyzed Commit"
            value={result.source?.commitSha || "Unavailable"}
          />

          <Detail
            label="Analyzed Branch"
            value={
              result.repository?.analyzedBranch ||
              repository?.default_branch ||
              "Unavailable"
            }
          />
        </div>
      </div>

      {/* RAW STATIC ANALYSIS */}
      <details className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
        <summary className="cursor-pointer font-semibold text-gray-900">
          View Detailed Static Analysis
        </summary>

        <pre className="mt-5 overflow-x-auto rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          {JSON.stringify(staticAnalysis, null, 2)}
        </pre>
      </details>

      {/* RAW AI METADATA */}
      <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
        <summary className="cursor-pointer font-semibold text-gray-900">
          View AI Analysis Metadata
        </summary>

        <pre className="mt-5 overflow-x-auto rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          {JSON.stringify(aiSummary, null, 2)}
        </pre>
      </details>

      {/* NAVIGATION */}
      <div className="mt-10 flex flex-wrap gap-4 print:hidden">
        <Link
          to="/dashboard"
          className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>

        <Link
          to="/history"
          className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Analysis History
        </Link>

        {repository?.github_url && (
          <a
            href={repository.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            View GitHub Repository
          </a>
        )}
      </div>
      </section>
    </main>
  );
}

// =========================================================
// COMPONENTS
// =========================================================

function MetricCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <p className="text-base font-semibold text-slate-500">{title}</p>

      <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function LanguageCard({ languages }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">Languages</h3>

      {languages.length > 0 ? (
        <div className="mt-5 space-y-4">
          {languages.map((language) => {
            const percentage = Number(language.percentage);
            const barWidth = Math.min(100, Math.max(0, percentage));

            return (
              <div key={language.language} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="gs-language-name font-semibold">
                    {language.language}
                  </span>
                  <span className="text-sm font-medium text-indigo-600">
                    {percentage.toFixed(2)}%
                  </span>
                </div>
                <div
                  className="gs-language-track h-2 overflow-hidden rounded-full"
                  role="progressbar"
                  aria-label={`${language.language} share`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={barWidth}
                >
                  <div
                    className="gs-language-fill h-full rounded-full transition-[width]"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          No language data available
        </p>
      )}
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item, index) => {
            const name =
              typeof item === "string"
                ? item
                : item?.name ||
                  item?.technology ||
                  JSON.stringify(item);

            return (
              <span
                key={`${name}-${index}`}
                className="rounded-full bg-indigo-50 px-3 py-2 text-base font-medium text-indigo-700"
              >
                {name}
              </span>
            );
          })
        ) : (
          <p className="text-sm text-gray-500">
            No data available
          </p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>

      <p className="mt-2 break-all text-lg font-semibold text-slate-900">
        {value ?? "—"}
      </p>
    </div>
  );
}

export default Results;