
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
 * Validate development user configuration.
 */
const validateUserId = (userId) => {
  if (!userId) {
    const error = new Error(
      "Development user is not configured. Check DEV_USER_ID."
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
  validateUserId(userId);

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
 * Retrieve all repositories belonging to a user.
 */
const getRepositoriesByUserId = async (userId) => {
  validateUserId(userId);

  return repositoryRepository.findRepositoriesByUserId(userId);
};

/**
 * Retrieve a single repository belonging to a user.
 */
const getRepositoryByIdAndUserId = async ({
  repositoryId,
  userId,
}) => {
  validateUserId(userId);

  if (!isValidUUID(repositoryId)) {
    const error = new Error("Invalid repository ID.");
    error.statusCode = 400;
    throw error;
  }

  const repository =
    await repositoryRepository.findRepositoryByIdAndUserId(
      repositoryId,
      userId
    );

  if (!repository) {
    const error = new Error("Repository not found.");
    error.statusCode = 404;
    throw error;
  }

  return repository;
};

const saveRepositoryByIdAndUserId = async ({
  repositoryId,
  userId,
}) => {
  const repository = await getRepositoryByIdAndUserId({
    repositoryId,
    userId,
  });

  if (repository.is_saved) {
    return repository;
  }

  const savedRepository =
    await repositoryRepository.markRepositoryAsSaved(
      repositoryId,
      userId
    );

  if (!savedRepository) {
    const error = new Error("Repository could not be saved.");
    error.statusCode = 404;
    throw error;
  }

  return savedRepository;
};

const saveAnalysisForUser = async ({
  analysisId,
  userId,
  guestUserId,
}) => {
  validateUserId(userId);
  validateUserId(guestUserId);

  if (!isValidUUID(analysisId)) {
    const error = new Error("Invalid analysis ID.");
    error.statusCode = 400;
    throw error;
  }

  return repositoryRepository.saveAnalysisForUser(
    analysisId,
    userId,
    guestUserId
  );
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
const analyzeRepositoryByIdAndUserId = async ({
  repositoryId,
  userId,
}) => {
  // Step 1: Verify repository ownership.
  const repository = await getRepositoryByIdAndUserId({
    repositoryId,
    userId,
  });

  return analyzeRepositoryRecord(repository);
};

const analyzeRepositoryUrlByUserId = async ({
  githubUrl,
  userId,
}) => {
  validateUserId(userId);

  const { owner, repository } =
    parseGithubRepositoryUrl(githubUrl);
  const githubRepository = await getRepository(owner, repository);
  const repositoryRecord = await saveRepository({
    userId,
    githubUrl: githubRepository.htmlUrl,
    githubRepository,
    isSaved: false,
  });

  return analyzeRepositoryRecord(repositoryRecord);
};

// =========================================================
// ANALYSIS HISTORY
// =========================================================

/**
 * Retrieve analysis history for a saved repository.
 */
const getAnalysisHistory = async ({
  repositoryId,
  userId,
}) => {
  const repository = await getRepositoryByIdAndUserId({
    repositoryId,
    userId,
  });

  const analyses =
    await analysisRepository.findAnalysesByRepositoryAndUser(
      repository.id,
      userId
    );

  return {
    repository,
    analyses,
  };
};

/**
 * Retrieve one persisted analysis.
 */
const getAnalysisById = async ({
  analysisId,
  userId,
}) => {
  validateUserId(userId);

  if (!isValidUUID(analysisId)) {
    const error = new Error("Invalid analysis ID.");
    error.statusCode = 400;
    throw error;
  }

  const analysis =
    await analysisRepository.findAnalysisByIdAndUser(
      analysisId,
      userId
    );

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
  saveRepositoryByIdAndUserId,
  saveAnalysisForUser,
  getRepositoriesByUserId,
  getRepositoryByIdAndUserId,
  analyzeRepositoryByIdAndUserId,
  analyzeRepositoryUrlByUserId,
  getAnalysisHistory,
  getAnalysisById,
};
