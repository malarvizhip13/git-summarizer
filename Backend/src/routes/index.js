const express = require("express");

const { query } = require("../config/database");
const repositoryController = require("../controllers/repositoryController");

const router = express.Router();

/**
 * GET /api/v1/health
 *
 * Checks whether the API and PostgreSQL database are available.
 */
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

/**
 * POST /api/v1/repositories
 *
 * Fetches and saves a GitHub repository.
 */
router.post(
  "/repositories",
  repositoryController.createRepository
);

/**
 * GET /api/v1/repositories
 *
 * Retrieves all saved repositories.
 */
router.get(
  "/repositories",
  repositoryController.getRepositories
);

/**
 * GET /api/v1/repositories/:id
 *
 * Retrieves a single saved repository.
 */
router.get(
  "/repositories/:id",
  repositoryController.getRepositoryById
);

module.exports = router;