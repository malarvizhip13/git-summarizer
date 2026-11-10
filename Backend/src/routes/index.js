
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { query } = require("../config/database");
const repositoryController = require("../controllers/repositoryController");
const authController = require("../controllers/authController");
const router = express.Router();
// AUTH ROUTES
router.post("/auth/signup", authController.signup);
router.post("/auth/signin", authController.signin);
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
router.post("/repositories", authMiddleware, repositoryController.createRepository);

/**
 * POST /api/v1/analyses
 */
router.post(
  "/analyses",
  authMiddleware,
  repositoryController.analyzeRepositoryUrl
);

/**
 * GET /api/v1/repositories
 */
router.get("/repositories", authMiddleware, repositoryController.getRepositories);
/**
 * GET /api/v1/repositories/:id
 */
router.get("/repositories/:id", authMiddleware, repositoryController.getRepositoryById);

/**
 * PATCH /api/v1/repositories/:id/save
 */
router.patch("/repositories/:id/save", authMiddleware, repositoryController.saveRepository);
/**
 * POST /api/v1/repositories/:id/analyze
 */
router.post("/repositories/:id/analyze", authMiddleware, repositoryController.analyzeRepository);
router.get(
  "/repositories/:id/analyses",
  authMiddleware,
  repositoryController.getAnalysisHistory
);
router.get(
  "/analyses/:analysisId",
  authMiddleware,
  repositoryController.getAnalysisById
);

module.exports = router;
