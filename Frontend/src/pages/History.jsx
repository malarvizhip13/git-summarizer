
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getRepositories,
  getAnalysisHistory,
} from "../services/api";

// =========================================================
// DATE FORMATTER
// =========================================================

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString();
};

// =========================================================
// ANALYSIS STATUS BADGE
// =========================================================

const StatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-green-100 text-green-700",
    running: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status || "unknown"}
    </span>
  );
};

// =========================================================
// HISTORY PAGE
// =========================================================

function History() {
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [analysesByRepository, setAnalysesByRepository] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // =======================================================
  // FETCH REPOSITORY ANALYSIS HISTORY
  // =======================================================

  const fetchRepositoryHistory = async (savedRepositories) => {
    const historyEntries = await Promise.all(
      savedRepositories.map(async (repository) => {
        try {
          const response = await getAnalysisHistory(repository.id);

          return [
            repository.id,
            {
              analyses: response.analyses || [],
              error: "",
            },
          ];
        } catch (historyError) {
          return [
            repository.id,
            {
              analyses: [],
              error: historyError.message,
            },
          ];
        }
      })
    );

    return Object.fromEntries(historyEntries);
  };

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    const loadInitialHistory = async () => {
      try {
        const repositoryResponse = await getRepositories();
        const savedRepositories =
          repositoryResponse.repositories || [];

        if (cancelled) return;

        setRepositories(savedRepositories);

        const historyMap =
          await fetchRepositoryHistory(savedRepositories);

        if (cancelled) return;

        setAnalysesByRepository(historyMap);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  // =======================================================
  // REFRESH HISTORY
  // =======================================================

  const loadHistory = useCallback(async () => {
    setError("");
    setRefreshing(true);

    try {
      const repositoryResponse = await getRepositories();
      const savedRepositories =
        repositoryResponse.repositories || [];

      setRepositories(savedRepositories);

      const historyMap =
        await fetchRepositoryHistory(savedRepositories);

      setAnalysesByRepository(historyMap);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // =======================================================
  // OPEN HISTORICAL ANALYSIS
  // =======================================================

  const openAnalysis = (analysisId) => {
    navigate(`/results/${analysisId}`);
  };

  // =======================================================
  // LOADING STATE
  // =======================================================

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />

          <p className="mt-4 text-gray-600">
            Loading your repository history...
          </p>
        </div>
      </section>
    );
  }

  // =======================================================
  // HISTORY PAGE UI
  // =======================================================

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* PAGE HEADER */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Repository History
          </h1>

          <p className="mt-2 text-gray-600">
            Public repositories and their previous AI analyses.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={refreshing}
          className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* REPOSITORY FETCH ERROR */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">
            Unable to load repositories
          </p>

          <p className="mt-1 text-sm">{error}</p>

          <button
            type="button"
            onClick={loadHistory}
            className="mt-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* EMPTY REPOSITORIES */}
      {!error && repositories.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            No repositories saved yet
          </h2>

          <p className="mt-2 text-gray-600">
            Add a GitHub repository to start analyzing it.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Analyze a repository
          </Link>
        </div>
      )}

      {/* REPOSITORY LIST */}
      <div className="space-y-8">
        {repositories.map((repository) => {
          const repositoryHistory =
            analysesByRepository[repository.id] || {
              analyses: [],
              error: "",
            };

          return (
            <article
              key={repository.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {/* REPOSITORY HEADER */}
              <div className="border-b border-gray-200 bg-gray-50 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {repository.github_owner}/{repository.github_name}
                    </h2>

                    <a
                      href={repository.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm text-indigo-600 hover:underline"
                    >
                      View on GitHub
                    </a>

                    <p className="mt-2 text-sm text-gray-500">
                      Branch: {repository.default_branch || "main"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Saved: {formatDate(repository.created_at)}
                    </p>
                  </div>

                  <Link
                    to="/dashboard"
                    state={{ repoUrl: repository.github_url }}
                    className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    Analyze again
                  </Link>
                </div>
              </div>

              {/* ANALYSIS HISTORY */}
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Previous analyses
                </h3>

                {/* INDIVIDUAL HISTORY ERROR */}
                {repositoryHistory.error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    Unable to load analyses: {repositoryHistory.error}
                  </p>
                )}

                {/* EMPTY ANALYSIS HISTORY */}
                {!repositoryHistory.error &&
                  repositoryHistory.analyses.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No analyses available for this repository yet.
                    </p>
                  )}

                {/* ANALYSIS RECORDS */}
                <div className="space-y-4">
                  {repositoryHistory.analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <StatusBadge status={analysis.status} />

                          <p className="mt-2 text-sm text-gray-500">
                            {formatDate(
                              analysis.completed_at || analysis.created_at
                            )}
                          </p>

                          {analysis.commit_sha && (
                            <p className="mt-1 text-xs text-gray-500">
                              Commit: {analysis.commit_sha.slice(0, 12)}
                            </p>
                          )}
                        </div>

                        {/* OPEN HISTORICAL RESULT */}
                        {analysis.status === "completed" && (
                          <button
                            type="button"
                            onClick={() => openAnalysis(analysis.id)}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                          >
                            View results
                          </button>
                        )}
                      </div>

                      {/* ANALYSIS SUMMARY */}
                      {analysis.summary && (
                        <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {analysis.summary}
                        </p>
                      )}

                      {/* ANALYSIS ERROR */}
                      {analysis.error_message && (
                        <p className="mt-3 text-sm text-red-600">
                          {analysis.error_message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default History;
