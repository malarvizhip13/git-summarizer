const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const defaultApiBaseUrl = import.meta.env.DEV
  ? "http://localhost:5000/api/v1"
  : "https://git-summarizer-backend.onrender.com/api/v1";

const API_BASE_URL = (
  configuredApiBaseUrl || defaultApiBaseUrl
).replace(/\/+$/, "");

/**
 * Centralized API request handler.
 *
 * Handles:
 * - JSON requests
 * - HTTP errors
 * - Backend error messages
 * - JSON response parsing
 */
const apiRequest = async (endpoint, options = {}) => {
  const {
    headers = {},
    ...requestOptions
  } = options;

  const token = sessionStorage.getItem("token");

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...requestOptions,
     headers: {
  Accept: "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...headers,
},
    });
  } catch {
    throw new Error(
      "Unable to connect to GitSummarizer backend. Make sure the backend server is running."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `The backend returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  if (data?.success === false) {
    throw new Error(
      data?.error?.message || "The API request was unsuccessful."
    );
  }

  return data;
};

// =========================================================
// HEALTH CHECK
// =========================================================

export const checkApiHealth = () => {
  return apiRequest("/health");
};

// =========================================================
// REPOSITORY APIs
// =========================================================

/**
 * Create or update a GitHub repository.
 *
 * POST /repositories
 */
export const createRepository = (githubUrl) => {
  return apiRequest("/repositories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      githubUrl,
    }),
  });
};

/**
 * Analyze a GitHub URL without adding it to the saved repositories list.
 *
 * POST /analyses
 */
export const analyzeRepositoryUrl = (githubUrl) => {
  return apiRequest("/analyses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      githubUrl,
    }),
  });
};

/**
 * Save a previously analyzed repository to the dashboard.
 *
 * PATCH /repositories/:id/save
 */
export const saveRepositoryById = (repositoryId) => {
  return apiRequest(
    `/repositories/${encodeURIComponent(repositoryId)}/save`,
    {
      method: "PATCH",
    }
  );
};

/**
 * Retrieve all saved repositories.
 *
 * GET /repositories
 */
export const getRepositories = () => {
  return apiRequest("/repositories");
};

/**
 * Retrieve a repository by ID.
 *
 * GET /repositories/:id
 */
export const getRepositoryById = (repositoryId) => {
  return apiRequest(
    `/repositories/${encodeURIComponent(repositoryId)}`
  );
};

// =========================================================
// REPOSITORY ANALYSIS APIs
// =========================================================

/**
 * Start repository analysis.
 *
 * POST /repositories/:id/analyze
 *
 * This request remains pending until backend analysis finishes.
 */
export const analyzeRepository = (repositoryId) => {
  return apiRequest(
    `/repositories/${encodeURIComponent(repositoryId)}/analyze`,
    {
      method: "POST",
    }
  );
};

/**
 * Retrieve analysis history for a repository.
 *
 * GET /repositories/:id/analyses
 */
export const getAnalysisHistory = (repositoryId) => {
  return apiRequest(
    `/repositories/${encodeURIComponent(repositoryId)}/analyses`
  );
};

/**
 * Retrieve one analysis report.
 *
 * GET /analyses/:analysisId
 */
export const getAnalysisById = (analysisId) => {
  return apiRequest(
    `/analyses/${encodeURIComponent(analysisId)}`
  );
};