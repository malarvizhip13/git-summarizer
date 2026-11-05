
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL || null;
const requiredEnvVariables = databaseUrl
  ? []
  : ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];

for (const key of requiredEnvVariables) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV || "development";
const frontendUrlValue =
  process.env.FRONTEND_URL ||
  (nodeEnv === "production" ? "" : "http://localhost:5173");

if (!frontendUrlValue) {
  throw new Error(
    "Missing required environment variable: FRONTEND_URL"
  );
}

let frontendOrigin;

try {
  const frontendUrl = new URL(frontendUrlValue);
  if (
    !["http:", "https:"].includes(frontendUrl.protocol) ||
    frontendUrl.pathname !== "/" ||
    frontendUrl.search ||
    frontendUrl.hash
  ) {
    throw new Error();
  }
  frontendOrigin = frontendUrl.origin;
} catch {
  throw new Error(
    "FRONTEND_URL must be an HTTP(S) origin without a path, query, or fragment."
  );
}

module.exports = {
  // Application configuration
  NODE_ENV: nodeEnv,
  PORT: Number(process.env.PORT) || 5000,

  // PostgreSQL configuration
  DATABASE_URL: databaseUrl,
  DB_HOST: process.env.DB_HOST || null,
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_NAME: process.env.DB_NAME || null,
  DB_USER: process.env.DB_USER || null,
  DB_PASSWORD: process.env.DB_PASSWORD || null,
  DB_SSL: process.env.DB_SSL === "true",
  DB_MIGRATION_USER: process.env.DB_MIGRATION_USER || null,
  DB_MIGRATION_PASSWORD: process.env.DB_MIGRATION_PASSWORD || null,

  // GitHub API configuration
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || null,

  // NVIDIA NIM AI configuration
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || null,

  NVIDIA_BASE_URL:
    process.env.NVIDIA_BASE_URL ||
    "https://integrate.api.nvidia.com/v1",

  NVIDIA_MODEL:
    process.env.NVIDIA_MODEL ||
    "nvidia/nemotron-3.5-lightning-30b-a3b",

  NVIDIA_MAX_TOKENS:
    Number(process.env.NVIDIA_MAX_TOKENS) || 4096,

  NVIDIA_TEMPERATURE:
    Number(process.env.NVIDIA_TEMPERATURE) || 0.2,

  PUBLIC_USER_ID: "00000000-0000-4000-8000-000000000001",

  // Frontend configuration
  FRONTEND_URL: frontendOrigin,
};
