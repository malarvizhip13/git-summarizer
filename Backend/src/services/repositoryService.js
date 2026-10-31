const repositoryRepository = require(
  "../repositories/repositoryRepository"
);

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

/**
 * Save or update a GitHub repository.
 */
const saveRepository = async ({
  userId,
  githubUrl,
  githubRepository,
}) => {
  validateUserId(userId);

  return repositoryRepository.upsertRepository({
    userId,
    githubUrl,
    githubOwner: githubRepository.owner,
    githubName: githubRepository.name,
    defaultBranch: githubRepository.defaultBranch,
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

module.exports = {
  saveRepository,
  getRepositoriesByUserId,
  getRepositoryByIdAndUserId,
};