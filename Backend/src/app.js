const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "GitSummarizer API is running"
  });
});

module.exports = app;