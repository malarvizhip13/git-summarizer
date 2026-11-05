import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  analyzeRepository,
  analyzeRepositoryUrl,
  createRepository,
  getRepositories,
} from "../services/api";
import AnalysisLoader from "../components/AnalysisLoader";

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString();
};

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const autoAnalyzeStarted = useRef(false);

  const [repoUrl, setRepoUrl] = useState(location.state?.repoUrl || "");
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingRepository, setAnalyzingRepository] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    const response = await getRepositories();
    setRepositories(response.repositories || []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initializeDashboard = async () => {
      try {
        const response = await getRepositories();
        if (!cancelled) {
          setRepositories(response.repositories || []);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Unable to load dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const openAnalysis = useCallback((response) => {
    if (!response.analysisId || !response.repository?.id) {
      throw new Error("Analysis response is missing its report details.");
    }

    navigate(`/results/${encodeURIComponent(response.analysisId)}`, {
      state: {
        repository: response.repository,
        analysisResponse: { analysis: response.analysis },
      },
    });
  }, [navigate]);

  const handleAnalyzeUrl = useCallback(async (url) => {
    const githubUrl = url.trim();

    if (!githubUrl || analyzing) return;

    setAnalyzing(true);
    setAnalyzingRepository(githubUrl);
    setError("");
    setMessage("");

    try {
      const response = await analyzeRepositoryUrl(githubUrl);
      openAnalysis(response);
    } catch (requestError) {
      setError(requestError.message || "Repository analysis failed.");
    } finally {
      setAnalyzing(false);
      setAnalyzingRepository("");
    }
  }, [analyzing, openAnalysis]);

  useEffect(() => {
    const initialUrl = location.state?.repoUrl;

    if (initialUrl && !autoAnalyzeStarted.current) {
      autoAnalyzeStarted.current = true;
      handleAnalyzeUrl(initialUrl);
    }
  }, [handleAnalyzeUrl, location.state]);

  const handleSaveRepository = async (event) => {
    event.preventDefault();

    const trimmedUrl = repoUrl.trim();
    if (!trimmedUrl || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await createRepository(trimmedUrl);
      if (!response.repository?.id) {
        throw new Error("Repository was not saved correctly.");
      }

      setRepoUrl("");
      setMessage(response.message || "Repository saved successfully.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message || "Unable to save repository.");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeSavedRepository = async (repository) => {
    if (!repository?.id || analyzing) return;

    const repositoryUrl = repository.github_url;
    setAnalyzing(true);
    setAnalyzingRepository(repositoryUrl);
    setError("");
    setMessage("");

    try {
      const response = await analyzeRepository(repository.id);
      openAnalysis({ ...response, repository });
    } catch (requestError) {
      setError(requestError.message || "Repository analysis failed.");
      setAnalyzing(false);
      setAnalyzingRepository("");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");

    try {
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message || "Unable to refresh repositories.");
    } finally {
      setRefreshing(false);
    }
  };

  if (analyzing) {
    return <AnalysisLoader repositoryUrl={analyzingRepository} />;
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Public repositories and analyses, ready to explore.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-1 text-sm">{error}</p>
          {location.state?.repoUrl && (
            <button
              type="button"
              onClick={() => handleAnalyzeUrl(location.state.repoUrl)}
              className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold hover:bg-red-100"
            >
              Retry analysis
            </button>
          )}
        </div>
      )}

      {message && (
        <div role="status" className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {message}
        </div>
      )}

      <div className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          Save a repository
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Add a repository directly, or analyze one first and save it from its report.
        </p>
        <form
          onSubmit={handleSaveRepository}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <label className="gs-sr-only" htmlFor="saved-repository-url">
            GitHub repository URL to save
          </label>
          <input
            id="saved-repository-url"
            type="url"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/owner/repository"
            required
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={saving || !repoUrl.trim()}
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save repository"}
          </button>
        </form>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Saved repositories</h2>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
          {repositories.length} saved
        </span>
      </div>

      {repositories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-800">
            No saved repositories yet
          </h3>
          <p className="mt-2 text-gray-600">
            Analyze a public GitHub repository, then save it from the report if you want to keep it here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg border border-indigo-200 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Analyze a repository
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {repositories.map((repository) => (
            <article
              key={repository.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-gray-900">
                    {repository.github_owner}/{repository.github_name}
                  </h3>
                  <a
                    href={repository.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-indigo-600 hover:underline"
                  >
                    View on GitHub ↗
                  </a>
                  <p className="mt-2 text-xs text-gray-500">
                    Saved {formatDate(repository.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAnalyzeSavedRepository(repository)}
                  disabled={analyzing}
                  className="shrink-0 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Analyze again
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Link
          to="/"
          className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}

export default Dashboard;
