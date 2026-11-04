import { Navigate, useLocation } from "react-router-dom";

import { startGoogleLogin } from "../services/api";
import { useAuth } from "../context/useAuth";

function Login() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const pendingAnalysis = window.sessionStorage.getItem(
    "gitsummarizer-pending-analysis"
  );

  if (!loading && user) {
    return (
      <Navigate
        to={
          pendingAnalysis
            ? "/auth/callback"
            : location.state?.from || "/dashboard"
        }
        replace
      />
    );
  }

  const isSaveFlow = Boolean(pendingAnalysis);

  const handleGoogleLogin = () => {
    window.sessionStorage.setItem(
      "gitsummarizer-return-to",
      location.state?.from || "/dashboard"
    );
    startGoogleLogin();
  };

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-lg items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <svg
            viewBox="0 0 48 48"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
            <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
            <path fill="#FBBC05" d="M12.6 27.5a12 12 0 0 1 0-7V15.2H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z" />
            <path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.2l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z" />
          </svg>
        </div>

        <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
          {isSaveFlow ? "Save your analysis" : "Your GitSummarizer account"}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
          {isSaveFlow ? "Keep this repository close." : "Welcome to GitSummarizer"}
        </h1>
        <p className="mt-4 text-slate-600">
          {isSaveFlow
            ? "Sign in or create a free account with Google. We’ll save this analysis to your personal dashboard when you return."
            : "Sign in or create a free account with Google to save repositories and revisit your analysis history."}
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Continue with Google
        </button>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          New here? Your Google sign-in creates your account automatically.
        </p>
      </section>
    </main>
  );
}

export default Login;
