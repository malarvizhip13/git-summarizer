
import { Link, NavLink } from "react-router-dom";
import { useState,useEffect } from "react";

const links = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
  { label: "About", path: "/about" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "History", path: "/history" },
];

function Navbar() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "dark"
  );

 
 const [user, setUser] = useState(() => {
  const savedUser = sessionStorage.getItem("loggedInUser");
  return savedUser ? JSON.parse(savedUser) : null;
});

useEffect(() => {
  const handleUserLogin = () => {
    const savedUser = sessionStorage.getItem("loggedInUser");
    setUser(savedUser ? JSON.parse(savedUser) : null);
  };

  window.addEventListener("userLogin", handleUserLogin);

  return () => {
    window.removeEventListener("userLogin", handleUserLogin);
  };
}, []);
  const linkStyle = ({ isActive }) =>
    `gs-nav-link${isActive ? " is-active" : ""}`;

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("gitsummarizer-theme", nextTheme);
    setTheme(nextTheme);
  };

  const firstLetter = user?.name?.charAt(0).toUpperCase();

  return (
    <header className="gs-site-header">
      <nav className="gs-nav" aria-label="Main navigation">
        <Link to="/" className="gs-brand" aria-label="GitSummarizer home">
          <span className="gs-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 18V6l7 7 7-7v12" />
              <path d="M5 18h14" />
            </svg>
          </span>
          GitSummarizer
        </Link>

        <div className="gs-nav-links">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              className={linkStyle}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div
              className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg"
              title={user.name}
            >
              {firstLetter}
            </div>
          ) : (
            <>
              <Link
                to="/signin"
                className="rounded-lg border border-indigo-500 px-4 py-2 text-sm font-semibold text-indigo-500 transition-all duration-300 hover:bg-indigo-500 hover:text-white"
              >
                Sign In
              </Link>

              <Link
                to="/signup"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-300 hover:bg-indigo-700 hover:shadow-indigo-500/40"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <Link to="/dashboard" className="gs-nav-cta">
          Start exploring
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h12m-5-5 5 5-5 5" />
          </svg>
        </Link>

        <button
          type="button"
          className="gs-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
            </svg>
          )}
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
