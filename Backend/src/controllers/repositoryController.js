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
} = require("../services/repositoryService");

const env = require("../config/env");

/**
 * POST /api/v1/repositories
 *
 * Fetches GitHub repository details
 * and saves the repository in PostgreSQL.
 */
const createRepository = async (req, res, next) => {
  try {
    const { githubUrl } = req.body || {};

    const {
      owner,
      repository,
    } = parseGithubRepositoryUrl(githubUrl);

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
 *
 * Retrieves all repositories belonging to the development user.
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
 *
 * Retrieves a single repository by its UUID.
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

module.exports = {
  createRepository,
  getRepositories,
  getRepositoryById,
};