const { Octokit } = require("octokit");

const env = require("../config/env");

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
});

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
    if (error.status === 404) {
      const repositoryError = new Error(
        "GitHub repository not found"
      );

      repositoryError.statusCode = 404;

      throw repositoryError;
    }

    if (error.status === 401) {
      const authError = new Error(
        "GitHub authentication failed"
      );

      authError.statusCode = 401;

      throw authError;
    }

    if (error.status === 403) {
      const permissionError = new Error(
        "GitHub API access forbidden"
      );

      permissionError.statusCode = 403;

      throw permissionError;
    }

    throw error;
  }
};

module.exports = {
  getRepository,
};