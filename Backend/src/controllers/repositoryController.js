
const {
  parseGithubRepositoryUrl,
} = require("../utils/githubUrl");

const {
  getRepository,
} = require("../services/githubService");

const {
  saveRepository,
  getPublicRepositories,
  getRepositoryById: getRepositoryByIdService,
  saveRepositoryById,
  analyzeRepositoryById: analyzeRepositoryByIdService,
  analyzeRepositoryUrl: analyzeRepositoryUrlService,
  getAnalysisHistory,
  getAnalysisById: getAnalysisByIdService,
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
      userId: env.PUBLIC_USER_ID,
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

const saveRepositoryController = async (req, res, next) => {
  try {
    const repository = await saveRepositoryById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Repository saved successfully",
      repository,
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
    const repositories = await getPublicRepositories();

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
    const repository = await getRepositoryByIdService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Repository retrieved successfully",
      repository,
    });
  } catch (error) {
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
    const result = await analyzeRepositoryByIdService(req.params.id);

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
    const result = await analyzeRepositoryUrlService(
      req.body?.githubUrl
    );

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
    const result = await getAnalysisHistory(req.params.id);

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
    const analysis = await getAnalysisByIdService(
      req.params.analysisId
    );

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
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
  saveRepository: saveRepositoryController,
  analyzeRepository,
  analyzeRepositoryUrl,
  getAnalysisHistory: getRepositoryAnalysisHistory,
  getAnalysisById: getAnalysisByIdController,
};
