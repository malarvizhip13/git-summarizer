/**
 * Parse and validate a GitHub repository URL.
 *
 * @param {string} githubUrl
 * @returns {{ owner: string, repository: string }}
 */
const parseGithubRepositoryUrl = (githubUrl) => {
  if (!githubUrl || typeof githubUrl !== "string") {
    const error = new Error("GitHub repository URL is required");
    error.statusCode = 400;
    throw error;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(githubUrl);
  } catch {
    const error = new Error("Invalid GitHub repository URL");
    error.statusCode = 400;
    throw error;
  }

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== "github.com"
  ) {
    const error = new Error(
      "URL must be a valid GitHub HTTPS repository URL"
    );

    error.statusCode = 400;
    throw error;
  }

  const parts = parsedUrl.pathname
    .replace(/\.git$/, "")
    .split("/")
    .filter(Boolean);

  if (parts.length !== 2) {
    const error = new Error(
      "GitHub URL must contain an owner and repository"
    );

    error.statusCode = 400;
    throw error;
  }

  const [owner, repository] = parts;

  return {
    owner,
    repository,
  };
};

module.exports = {
  parseGithubRepositoryUrl,
};