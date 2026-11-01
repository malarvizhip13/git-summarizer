
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
  analyzeRepositoryByIdAndUserId,
} = require("../services/repositoryService");

const env = require("../config/env");

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
      userId: env.DEV_USER_ID,
      githubUrl,
      githubRepository,
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

/**
 * GET /api/v1/repositories
 */
const getRepositories = async (req, res, next) => {
  try {
    const repositories = await getRepositoriesByUserId(
      env.DEV_USER_ID
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

/**
 * GET /api/v1/repositories/:id
 */
const getRepositoryById = async (req, res, next) => {
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
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/repositories/:id/analyze
 */
const analyzeRepository = async (req, res, next) => {
  try {
    const result = await analyzeRepositoryByIdAndUserId({
      repositoryId: req.params.id,
      userId: env.DEV_USER_ID,
    });

    return res.status(200).json({
      success: true,
      message: "Repository analysis completed successfully",
      repository: result.repository,
      analysis: result.analysis,
    });
  } catch (error) {
    return next(error);
  }
};
/**
 * GET /api/v1/repositories/:id/analyses
 */
const getAnalysisHistory = async (req, res, next) => {
  try {
    const result = await require("../services/repositoryService")
      .getAnalysisHistory({
        repositoryId: req.params.id,
        userId: env.DEV_USER_ID,
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

/**
 * GET /api/v1/analyses/:analysisId
 */
const getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await require("../services/repositoryService")
      .getAnalysisById({
        analysisId: req.params.analysisId,
        userId: env.DEV_USER_ID,
      });

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    return next(error);
  }
};
module.exports = {
  createRepository,
  getRepositories,
  getRepositoryById,
  analyzeRepository,
  getAnalysisHistory,
  getAnalysisById,
};
