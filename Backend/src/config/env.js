
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
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT),

  // PostgreSQL configuration
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT),
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  // GitHub API configuration
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || null,

  // Temporary development user
  DEV_USER_ID: process.env.DEV_USER_ID || null,
};
