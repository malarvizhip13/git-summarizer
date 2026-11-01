
const { Octokit } = require("octokit");

const env = require("../config/env");
const {
  DEFAULT_MAX_FILE_SIZE,
} = require("../analyzers/fileFilter");

// Shared Octokit client.
const octokit = new Octokit({
  auth: env.GITHUB_TOKEN || undefined,
});

/**
 * Convert GitHub API errors into application errors.
 */
const handleGitHubError = (error) => {
  if (error.status === 404) {
    const repositoryError = new Error(
      "GitHub repository, branch, or file blob not found."
    );
    repositoryError.statusCode = 404;
    return repositoryError;
  }

  if (error.status === 401) {
    const authError = new Error(
      "GitHub authentication failed."
    );
    authError.statusCode = 401;
    return authError;
  }

  if (error.status === 403) {
    const permissionError = new Error(
      "GitHub API access forbidden or rate limit exceeded."
    );
    permissionError.statusCode = 403;
    return permissionError;
  }

  return error;
};

/**
 * Retrieve GitHub repository metadata.
 */
const getRepository = async (owner, repository) => {
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo: repository,
    });

    return {
      id: data.id,
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      htmlUrl: data.html_url,
      description: data.description,
      defaultBranch: data.default_branch,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      visibility: data.visibility,
      isPrivate: data.private,
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
};

/**
 * Retrieve a repository's complete recursive Git tree.
 */
const getRepositoryTree = async (
  owner,
  repository,
  branch
) => {
  try {
    if (!branch || typeof branch !== "string") {
      const error = new Error(
        "A valid repository branch is required."
      );
      error.statusCode = 400;
      throw error;
    }

    const branchResponse = await octokit.rest.repos.getBranch({
      owner,
      repo: repository,
      branch,
    });

    const branchData = branchResponse.data;

    const commitSha = branchData.commit.sha;
    const treeSha = branchData.commit.commit.tree.sha;

    const treeResponse = await octokit.rest.git.getTree({
      owner,
      repo: repository,
      tree_sha: treeSha,
      recursive: "true",
    });

    const treeData = treeResponse.data;

    const entries = treeData.tree.map((item) => ({
      path: item.path,
      mode: item.mode,
      type: item.type,
      sha: item.sha,
      size: item.size ?? null,
    }));

    return {
      branch,
      commitSha,
      treeSha: treeData.sha,
      truncated: treeData.truncated,
      totalCount: entries.length,
      entries,
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
};

/**
 * Retrieve the actual text content of one repository file.
 */
const getRepositoryFileContent = async (
  owner,
  repository,
  file
) => {
  try {
    if (
      !file ||
      typeof file.sha !== "string" ||
      !file.sha
    ) {
      const error = new Error(
        "A valid GitHub file blob SHA is required."
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      typeof file.size === "number" &&
      file.size > DEFAULT_MAX_FILE_SIZE
    ) {
      const error = new Error(
        "File exceeds the maximum allowed analysis size."
      );
      error.statusCode = 413;
      throw error;
    }

    const { data } = await octokit.rest.git.getBlob({
      owner,
      repo: repository,
      file_sha: file.sha,
    });

    if (data.encoding !== "base64") {
      const error = new Error(
        "Unsupported GitHub blob encoding."
      );
      error.statusCode = 422;
      throw error;
    }

    if (data.size > DEFAULT_MAX_FILE_SIZE) {
      const error = new Error(
        "File exceeds the maximum allowed analysis size."
      );
      error.statusCode = 413;
      throw error;
    }

    const fileBuffer = Buffer.from(
      data.content,
      "base64"
    );

    // Reject binary content.
    if (fileBuffer.includes(0)) {
      const error = new Error(
        "Binary files cannot be processed as source code."
      );
      error.statusCode = 422;
      throw error;
    }

    return {
      path: file.path,
      sha: data.sha,
      size: data.size,
      content: fileBuffer.toString("utf8"),
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
};

/**
 * Retrieve multiple repository files with controlled concurrency.
 */
const getRepositoryFilesContent = async (
  owner,
  repository,
  files,
  options = {}
) => {
  if (!Array.isArray(files)) {
    throw new TypeError("Files must be an array.");
  }

  const concurrency = options.concurrency ?? 5;
  const maxFiles = options.maxFiles ?? 50;

  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 5
  ) {
    throw new RangeError(
      "Concurrency must be between 1 and 5."
    );
  }

  if (!Number.isInteger(maxFiles) || maxFiles < 1) {
    throw new RangeError(
      "maxFiles must be a positive integer."
    );
  }

  const selectedFiles = files.slice(0, maxFiles);

  const results = new Array(selectedFiles.length);
  const failures = [];

  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex++;

      if (currentIndex >= selectedFiles.length) {
        return;
      }

      const file = selectedFiles[currentIndex];

      try {
        const content = await getRepositoryFileContent(
          owner,
          repository,
          file
        );

        results[currentIndex] = content;
      } catch (error) {
        failures.push({
          path: file.path,
          message: error.message,
          statusCode: error.statusCode || 500,
        });
      }
    }
  };

  const workerCount = Math.min(
    concurrency,
    selectedFiles.length
  );

  await Promise.all(
    Array.from(
      { length: workerCount },
      () => worker()
    )
  );

  const successfulFiles = results.filter(Boolean);

  return {
    files: successfulFiles,
    failures,
    stats: {
      requested: selectedFiles.length,
      successful: successfulFiles.length,
      failed: failures.length,
      skipped: files.length - selectedFiles.length,
      concurrency,
    },
  };
};

// Export all functions only after their declarations.
module.exports = {
  getRepository,
  getRepositoryTree,
  getRepositoryFileContent,
  getRepositoryFilesContent,
};
