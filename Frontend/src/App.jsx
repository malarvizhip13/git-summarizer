
import { Link, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Features from "./pages/Features";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Results from "./pages/Results";
import History from "./pages/History";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import GuestAnalysis from "./pages/GuestAnalysis";

import "./App.css";

function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-bold text-gray-900">
        404
      </h1>

      <p className="mt-3 text-gray-600">
        The page you're looking for doesn't exist.
      </p>

      <Link
        to="/"
        className="mt-6 font-semibold text-indigo-600 hover:underline"
      >
        Return Home
      </Link>
    </section>
  );
}

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/analyze" element={<GuestAnalysis />} />

          {/* Application Pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/results" element={<Results />} />
          <Route path="/results/:analysisId" element={<Results />} />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
