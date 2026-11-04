
const {
  parseGithubRepositoryUrl,
} = require("../utils/githubUrl");

const {
  getRepository,
} = require("../services/githubService");

const {
  saveRepository,
  getRepositoriesByUserId,
  getRepositoryByIdAndUserId,
  saveRepositoryByIdAndUserId,
  analyzeRepositoryByIdAndUserId,
  analyzeRepositoryUrlByUserId,
  getAnalysisHistory,
  getAnalysisById,
  saveAnalysisForUser,
} = require("../services/repositoryService");

const env = require("../config/env");

// =========================================================
// CREATE REPOSITORY
// =========================================================

/**
 * POST /api/v1/repositories
 */
const createRepository = async (req, res, next) => {
  try {
    const { githubUrl } = req.body || {};

    const { owner, repository } =
      parseGithubRepositoryUrl(githubUrl);

    const githubRepository = await getRepository(
      owner,
      repository
    );

    const savedRepository = await saveRepository({
      userId: req.user.id,
      githubUrl,
      githubRepository,
      isSaved: true,
    });

    const { created, ...repositoryData } = savedRepository;

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created
        ? "GitHub repository added successfully"
        : "GitHub repository already exists and was updated",
      repository: repositoryData,
    });
  } catch (error) {
    return next(error);
  }
};

const saveRepositoryForUser = async (req, res, next) => {
  try {
    const repository = await saveRepositoryByIdAndUserId({
      repositoryId: req.params.id,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Repository saved successfully",
      repository,
    });
  } catch (error) {
    return next(error);
  }
};

const saveAnalysis = async (req, res, next) => {
  try {
    const result = await saveAnalysisForUser({
      analysisId: req.body?.analysisId,
      userId: req.user.id,
      guestUserId: env.DEV_USER_ID,
    });

    return res.status(200).json({
      success: true,
      message: "Analysis saved to your account.",
      repository: result.repository,
      analysisId: result.analysisId,
    });
  } catch (error) {
    return next(error);
  }
};

// =========================================================
// GET REPOSITORIES
// =========================================================

/**
 * GET /api/v1/repositories
 */
const getRepositories = async (req, res, next) => {
  try {
    const repositories = await getRepositoriesByUserId(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Repositories retrieved successfully",
      count: repositories.length,
      repositories,
    });
  } catch (error) {
    return next(error);
  }
};

// =========================================================
// GET REPOSITORY BY ID
// =========================================================

/**
 * GET /api/v1/repositories/:id
 */
const getRepositoryById = async (req, res, next) => {
  try {
    const repository = await getRepositoryByIdAndUserId({
      repositoryId: req.params.id,
      userId: req.user?.id || env.DEV_USER_ID,
    });

    return res.status(200).json({
      success: true,
      message: "Repository retrieved successfully",
      repository,
    });
  } catch (error) {
    if (req.user && error.statusCode === 404 && env.DEV_USER_ID) {
      try {
        const repository = await getRepositoryByIdAndUserId({
          repositoryId: req.params.id,
          userId: env.DEV_USER_ID,
        });

        return res.status(200).json({
          success: true,
          message: "Repository retrieved successfully",
          repository,
        });
      } catch (fallbackError) {
        return next(fallbackError);
      }
    }

    return next(error);
  }
};

// =========================================================
// ANALYZE REPOSITORY
// =========================================================

/**
 * POST /api/v1/repositories/:id/analyze
 */
const analyzeRepository = async (req, res, next) => {
  try {
    const result = await analyzeRepositoryByIdAndUserId({
      repositoryId: req.params.id,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Repository analysis completed successfully",
      repository: result.repository,
      analysisId: result.analysisId,
      analysis: result.analysis,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/analyses
 */
const analyzeRepositoryUrl = async (req, res, next) => {
  try {
    const result = await analyzeRepositoryUrlByUserId({
      githubUrl: req.body?.githubUrl,
      userId: env.DEV_USER_ID,
    });

    return res.status(200).json({
      success: true,
      message: "Repository analysis completed successfully",
      repository: result.repository,
      analysisId: result.analysisId,
      analysis: result.analysis,
    });
  } catch (error) {
    return next(error);
  }
};

// =========================================================
// ANALYSIS HISTORY
// =========================================================

/**
 * GET /api/v1/repositories/:id/analyses
 */
const getRepositoryAnalysisHistory = async (req, res, next) => {
  try {
    const result = await getAnalysisHistory({
      repositoryId: req.params.id,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      count: result.analyses.length,
      repository: result.repository,
      analyses: result.analyses,
    });
  } catch (error) {
    return next(error);
  }
};

// =========================================================
// GET ANALYSIS BY ID
// =========================================================

/**
 * GET /api/v1/analyses/:analysisId
 */
const getAnalysisByIdController = async (req, res, next) => {
  try {
    const analysis = await getAnalysisById({
      analysisId: req.params.analysisId,
      userId: req.user?.id || env.DEV_USER_ID,
    });

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    if (req.user && error.statusCode === 404 && env.DEV_USER_ID) {
      try {
        const analysis = await getAnalysisById({
          analysisId: req.params.analysisId,
          userId: env.DEV_USER_ID,
        });

        return res.status(200).json({
          success: true,
          analysis,
        });
      } catch (fallbackError) {
        return next(fallbackError);
      }
    }

    return next(error);
  }
};

// =========================================================
// MODULE EXPORTS
// =========================================================

module.exports = {
  createRepository,
  getRepositories,
  getRepositoryById,
  saveRepository: saveRepositoryForUser,
  saveAnalysis,
  analyzeRepository,
  analyzeRepositoryUrl,
  getAnalysisHistory: getRepositoryAnalysisHistory,
  getAnalysisById: getAnalysisByIdController,
};
