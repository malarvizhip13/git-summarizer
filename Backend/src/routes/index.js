const express = require("express");

const { query } = require("../config/database");

const router = express.Router();

router.get("/health", async (req, res, next) => {
  try {
    await query("SELECT 1");

    return res.status(200).json({
      success: true,
      message: "GitSummarizer API is running",
      services: {
        api: "healthy",
        database: "healthy",
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;