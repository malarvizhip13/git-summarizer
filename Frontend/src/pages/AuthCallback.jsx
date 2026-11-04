import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { saveAnalysisToAccount } from "../services/api";

const getErrorMessage = (code) => {
  const messages = {
    google_authorization_denied: "Google sign-in was cancelled.",
    invalid_oauth_state: "The sign-in request expired. Please try again.",
    missing_authorization_code: "Google did not complete the sign-in.",
    google_sign_in_failed: "Google sign-in failed. Please try again.",
    google_profile_unavailable: "Could not retrieve your Google profile.",
    verified_email_required:
      "A verified email address is required to create your account.",
    google_sign_in_not_configured:
      "Google sign-in is not configured on this server yet.",
    google_account_conflict:
      "This email is already associated with another sign-in account. Please contact support.",
  };
  return messages[code] || "Sign-in could not be completed.";
};

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const started = useRef(false);

  const finishSignIn = useCallback(async () => {
    setError("");

    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(getErrorMessage(oauthError));
      return;
    }

    setSaving(true);
    try {
      const user = await refreshUser();
      if (!user) {
        throw new Error("Google sign-in did not create a session.");
      }

      const pendingAnalysisId = window.sessionStorage.getItem(
        "gitsummarizer-pending-analysis"
      );

      if (pendingAnalysisId) {
        const response = await saveAnalysisToAccount(pendingAnalysisId);
        window.sessionStorage.removeItem(
          "gitsummarizer-pending-analysis"
        );
        window.sessionStorage.removeItem("gitsummarizer-return-to");
        navigate(
          `/results/${encodeURIComponent(response.analysisId)}`,
          {
            replace: true,
            state: { saveMessage: "Analysis saved to your dashboard." },
          }
        );
        return;
      }

      const returnTo =
        window.sessionStorage.getItem("gitsummarizer-return-to") ||
        "/dashboard";
      window.sessionStorage.removeItem("gitsummarizer-return-to");
      navigate(
        ["/dashboard", "/history"].includes(returnTo)
          ? returnTo
          : "/dashboard",
        { replace: true }
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to complete sign-in.");
    } finally {
      setSaving(false);
    }
  }, [navigate, refreshUser, searchParams]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    finishSignIn();
  }, [finishSignIn]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-lg items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Sign-in needs another try
          </h1>
          <p role="alert" className="mt-3 text-red-700">{error}</p>
          <div className="mt-6 flex justify-center gap-4">
            {!searchParams.get("error") &&
              window.sessionStorage.getItem(
                "gitsummarizer-pending-analysis"
              ) && (
              <button
                type="button"
                onClick={finishSignIn}
                className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Retry saving
              </button>
            )}
            <Link
              to="/login"
              className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-lg items-center justify-center px-6 py-16 text-center">
      <div>
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          {saving ? "Finishing your sign-in..." : "Checking your account..."}
        </h1>
        <p className="mt-3 text-slate-600">
          If you chose Save, we’ll add that analysis to your dashboard now.
        </p>
      </div>
    </main>
  );
}

export default AuthCallback;
