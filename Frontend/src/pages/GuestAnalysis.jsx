import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { analyzeRepositoryUrl } from "../services/api";
import AnalysisLoader from "../components/AnalysisLoader";

function GuestAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysisRequest = useRef({ repositoryUrl: null, promise: null });
  const [error, setError] = useState("");

  useEffect(() => {
    const repositoryUrl = location.state?.repoUrl;
    if (!repositoryUrl) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;
    if (analysisRequest.current.repositoryUrl !== repositoryUrl) {
      analysisRequest.current = {
        repositoryUrl,
        promise: analyzeRepositoryUrl(repositoryUrl),
      };
    }

    const analyze = async () => {
      try {
        const response = await analysisRequest.current.promise;
        if (cancelled) return;
        if (!response.analysisId || !response.repository) {
          throw new Error("Analysis response is missing its report details.");
        }

        navigate(`/results/${encodeURIComponent(response.analysisId)}`, {
          replace: true,
          state: {
            repository: response.repository,
            analysisResponse: { analysis: response.analysis },
          },
        });
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Repository analysis failed.");
        }
      }
    };

    analyze();
    return () => {
      cancelled = true;
    };
  }, [location.state, navigate]);

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Analysis could not be completed
        </h1>
        <p role="alert" className="mt-4 text-red-600">{error}</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Try another repository
        </Link>
      </section>
    );
  }

  return (
    <AnalysisLoader
      repositoryUrl={location.state?.repoUrl}
      description="We’re mapping the project structure and preparing your report. This can take a little while for larger repositories."
      footnote="Your report will be available in the public analysis history."
    />
  );
}

export default GuestAnalysis;
