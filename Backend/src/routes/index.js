
const express = require("express");

const { query } = require("../config/database");
const authController = require("../controllers/authController");
const optionalAuth = require("../middleware/optionalAuth");
const requireAuth = require("../middleware/requireAuth");
const repositoryController = require("../controllers/repositoryController");

const router = express.Router();

router.get("/auth/google", authController.startGoogleOAuth);
router.get(
  "/auth/google/callback",
  authController.completeGoogleOAuth
);
router.get("/auth/me", authController.getCurrentUser);
router.post("/auth/logout", authController.logout);

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
router.post(
  "/repositories",
  requireAuth,
  repositoryController.createRepository
);

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
router.get(
  "/repositories",
  requireAuth,
  repositoryController.getRepositories
);

router.post(
  "/repositories/save-analysis",
  requireAuth,
  repositoryController.saveAnalysis
);

/**
 * GET /api/v1/repositories/:id
 */
router.get(
  "/repositories/:id",
  optionalAuth,
  repositoryController.getRepositoryById
);

/**
 * PATCH /api/v1/repositories/:id/save
 */
router.patch(
  "/repositories/:id/save",
  requireAuth,
  repositoryController.saveRepository
);

/**
 * POST /api/v1/repositories/:id/analyze
 */
router.post(
  "/repositories/:id/analyze",
  requireAuth,
  repositoryController.analyzeRepository
);
router.get(
  "/repositories/:id/analyses",
  requireAuth,
  repositoryController.getAnalysisHistory
);

router.get(
  "/analyses/:analysisId",
  optionalAuth,
  repositoryController.getAnalysisById
);
module.exports = router;
