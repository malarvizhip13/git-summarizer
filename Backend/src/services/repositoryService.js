
const repositoryRepository = require(
  "../repositories/repositoryRepository"
);

const analysisRepository = require(
  "../repositories/analysisRepository"
);

const {
  analyzeGitHubRepository,
} = require("./analysisService");

const { getRepository } = require("./githubService");
const { parseGithubRepositoryUrl } = require("../utils/githubUrl");
const env = require("../config/env");

// =========================================================
// VALIDATION
// =========================================================

/**
 * Validate UUID format.
 */
const isValidUUID = (value) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return typeof value === "string" && uuidRegex.test(value);
};

/**
 * Validate the shared public repository owner configuration.
 */
const validatePublicUserId = (userId) => {
  if (!userId) {
    const error = new Error(
      "The public repository owner is not configured."
    );

    error.statusCode = 500;
    throw error;
  }
};

// =========================================================
// REPOSITORY OPERATIONS
// =========================================================

/**
 * Save or update a GitHub repository.
 */
const saveRepository = async ({
  userId,
  githubUrl,
  githubRepository,
  isSaved = true,
}) => {
  validatePublicUserId(userId);
  await repositoryRepository.ensurePublicUser(userId);

  return repositoryRepository.upsertRepository({
    userId,
    githubUrl,
    githubOwner: githubRepository.owner,
    githubName: githubRepository.name,
    defaultBranch: githubRepository.defaultBranch,
    isSaved,
  });
};

/**
 * Retrieve repositories available in the public library.
 */
const getPublicRepositories = async () => {
  return repositoryRepository.findPublicRepositories();
};

/**
 * Retrieve a repository by ID.
 */
const getRepositoryById = async (repositoryId) => {
  if (!isValidUUID(repositoryId)) {
    const error = new Error("Invalid repository ID.");
    error.statusCode = 400;
    throw error;
  }

  const repository = await repositoryRepository.findRepositoryById(
    repositoryId
  );

  if (!repository) {
    const error = new Error("Repository not found.");
    error.statusCode = 404;
    throw error;
  }

  return repository;
};

const saveRepositoryById = async (repositoryId) => {
  const repository = await getRepositoryById(repositoryId);

  if (repository.is_saved) {
    return repository;
  }

  const savedRepository =
    await repositoryRepository.markRepositoryAsSaved(repositoryId);

  if (!savedRepository) {
    const error = new Error("Repository could not be saved.");
    error.statusCode = 404;
    throw error;
  }

  return savedRepository;
};

// =========================================================
// REPOSITORY ANALYSIS
// =========================================================

const analyzeRepositoryRecord = async (repository) => {
  const analysisRecord = await analysisRepository.createAnalysis(
    repository.id
  );

  try {
    const analysisResult = await analyzeGitHubRepository({
      owner: repository.github_owner,
      repository: repository.github_name,
      branch: repository.default_branch,
    });

    const aiSummary =
      typeof analysisResult.aiSummary?.summary === "string"
        ? analysisResult.aiSummary.summary
        : null;

    const completedAnalysis =
      await analysisRepository.completeAnalysis({
        analysisId: analysisRecord.id,
        commitSha: analysisResult.source.commitSha,
        summary: aiSummary,
        analysisResult,
      });

    if (!completedAnalysis) {
      throw new Error(
        "Analysis record could not be marked as completed."
      );
    }

    return {
      repository,
      analysisRecord: completedAnalysis,
      analysisId: completedAnalysis.id,
      analysis: completedAnalysis.analysis_result,
    };
  } catch (error) {
    try {
      const failedAnalysis =
        await analysisRepository.failAnalysis({
          analysisId: analysisRecord.id,
          errorMessage:
            error.message || "Repository analysis failed.",
        });

      if (!failedAnalysis) {
        error.persistenceError =
          "The analysis failure status could not be saved.";
      }
    } catch (persistenceError) {
      error.persistenceError = persistenceError.message;
    }

    throw error;
  }
};

/**
 * Analyze a saved GitHub repository and persist its result.
 */
const analyzeRepositoryById = async (repositoryId) => {
  const repository = await getRepositoryById(repositoryId);

  return analyzeRepositoryRecord(repository);
};

const analyzeRepositoryUrl = async (githubUrl) => {
  const { owner, repository } =
    parseGithubRepositoryUrl(githubUrl);
  const githubRepository = await getRepository(owner, repository);
  const repositoryRecord = await saveRepository({
    userId: env.PUBLIC_USER_ID,
    githubUrl: githubRepository.htmlUrl,
    githubRepository,
    isSaved: true,
  });

  return analyzeRepositoryRecord(repositoryRecord);
};

// =========================================================
// ANALYSIS HISTORY
// =========================================================

/**
 * Retrieve analysis history for a saved repository.
 */
const getAnalysisHistory = async (repositoryId) => {
  const repository = await getRepositoryById(repositoryId);

  const analyses = await analysisRepository.findAnalysesByRepository(
    repository.id
  );

  return {
    repository,
    analyses,
  };
};

/**
 * Retrieve one persisted analysis.
 */
const getAnalysisById = async (analysisId) => {
  if (!isValidUUID(analysisId)) {
    const error = new Error("Invalid analysis ID.");
    error.statusCode = 400;
    throw error;
  }

  const analysis = await analysisRepository.findAnalysisById(analysisId);

  if (!analysis) {
    const error = new Error("Analysis not found.");
    error.statusCode = 404;
    throw error;
  }

  return analysis;
};

// =========================================================
// MODULE EXPORTS
// =========================================================

module.exports = {
  saveRepository,
  saveRepositoryById,
  getPublicRepositories,
  getRepositoryById,
  analyzeRepositoryById,
  analyzeRepositoryUrl,
  getAnalysisHistory,
  getAnalysisById,
};
