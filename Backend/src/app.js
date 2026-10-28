const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const pool = require("./config/database");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/v1/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      success: true,
      message: "GitSummarizer API is running",
      services: {
        api: "healthy",
        database: "healthy",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(503).json({
      success: false,
      message: "GitSummarizer API is unhealthy",
      services: {
        api: "healthy",
        database: "unhealthy",
      },
    });
  }
});

module.exports = app;