import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthContext from "./authContext";
import {
  getCurrentUser,
  logout as logoutRequest,
} from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((response) => {
        if (cancelled) return;
        setUser(response.user || null);
        setAuthError("");
      })
      .catch((error) => {
        if (!cancelled) {
          setAuthError(
            error.message || "Unable to check sign-in status."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.user || null);
      setAuthError("");
      return response.user || null;
    } catch (error) {
      setAuthError(error.message || "Unable to check sign-in status.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError("");
    try {
      await logoutRequest();
      setUser(null);
    } catch (error) {
      setAuthError(error.message || "Unable to sign out.");
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      refreshUser,
      signOut,
    }),
    [user, loading, authError, refreshUser, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
