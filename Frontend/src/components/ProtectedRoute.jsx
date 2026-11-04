import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-gray-600">Checking your sign-in...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
