
require("dotenv").config();

const requiredEnvVariables = [
  "NODE_ENV",
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

for (const key of requiredEnvVariables) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  // Application configuration
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT),

  // PostgreSQL configuration
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT),
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
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

  // Legacy Claude configuration (temporary)
  ANTHROPIC_API_KEY:
    process.env.ANTHROPIC_API_KEY || null,

  CLAUDE_MODEL:
    process.env.CLAUDE_MODEL || "claude-sonnet-5-5",

  // Existing Ollama configuration (temporary)
  OLLAMA_BASE_URL:
    process.env.OLLAMA_BASE_URL ||
    "http://localhost:11434/v1",

  OLLAMA_MODEL:
    process.env.OLLAMA_MODEL || "qwen2.5-coder:7b",

  OLLAMA_TIMEOUT:
    Number(process.env.OLLAMA_TIMEOUT) || 300000,

  // Temporary development user
  DEV_USER_ID: process.env.DEV_USER_ID || null,

  // Google OAuth configuration
  GOOGLE_OAUTH_CLIENT_ID:
    process.env.GOOGLE_OAUTH_CLIENT_ID || null,

  GOOGLE_OAUTH_CLIENT_SECRET:
    process.env.GOOGLE_OAUTH_CLIENT_SECRET || null,

  GOOGLE_OAUTH_CALLBACK_URL:
    process.env.GOOGLE_OAUTH_CALLBACK_URL ||
    "http://localhost:5000/api/v1/auth/google/callback",

  // Frontend configuration
  FRONTEND_URL:
    process.env.FRONTEND_URL || "http://localhost:5173",
};
