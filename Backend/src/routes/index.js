
const express = require("express");

const { query } = require("../config/database");
const repositoryController = require("../controllers/repositoryController");

const router = express.Router();

/**
 * GET /api/v1/health
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
 */
router.post("/repositories", repositoryController.createRepository);

/**
 * POST /api/v1/analyses
 */
router.post(
  "/analyses",
  repositoryController.analyzeRepositoryUrl
);

/**
 * GET /api/v1/repositories
 */
router.get("/repositories", repositoryController.getRepositories);

/**
 * GET /api/v1/repositories/:id
 */
router.get("/repositories/:id", repositoryController.getRepositoryById);

/**
 * PATCH /api/v1/repositories/:id/save
 */
router.patch("/repositories/:id/save", repositoryController.saveRepository);

/**
 * POST /api/v1/repositories/:id/analyze
 */
router.post(
  "/repositories/:id/analyze",
  repositoryController.analyzeRepository
);
router.get(
  "/repositories/:id/analyses",
  repositoryController.getAnalysisHistory
);

router.get("/analyses/:analysisId", repositoryController.getAnalysisById);
module.exports = router;
