
const {
  getRepository,
  getRepositoryTree,
  getRepositoryFilesContent,
} = require("./githubService");

const {
  filterRepositoryFiles,
} = require("../analyzers/fileFilter");

const {
  analyzeRepository,
} = require("../analyzers/repositoryAnalyzer");

const DEFAULT_ANALYSIS_OPTIONS = {
  concurrency: 5,
  maxFiles: 50,
};
const CONFIGURATION_PRIORITY = new Set([
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Gemfile",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "angular.json",
]);

const SOURCE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx",
  ".py", ".java", ".go", ".rs",
  ".cpp", ".c", ".cs", ".php",
  ".rb", ".swift", ".kt", ".dart",
]);

const prioritizeFiles = (files) => {
  return [...files].sort((a, b) => {
    const getPriority = (file) => {
      const fileName = require("path").posix.basename(
        file.path.replace(/\\/g, "/")
      );

      if (CONFIGURATION_PRIORITY.has(fileName)) return 0;

      const extension = require("path").extname(file.path).toLowerCase();

      if (SOURCE_EXTENSIONS.has(extension)) return 1;

      return 2;
    };

    return getPriority(a) - getPriority(b);
  });
};
const analyzeGitHubRepository = async ({
  owner,
  repository,
  branch,
  options = {},
}) => {
  if (
    typeof owner !== "string" ||
    !owner.trim() ||
    typeof repository !== "string" ||
    !repository.trim()
  ) {
    throw new TypeError(
      "GitHub owner and repository are required."
    );
  }

  const analysisOptions = {
    ...DEFAULT_ANALYSIS_OPTIONS,
    ...options,
  };

  // Step 1: Retrieve GitHub repository metadata.
  const repositoryMetadata = await getRepository(
    owner,
    repository
  );

  // Step 2: Retrieve repository tree.
  const selectedBranch =
    branch || repositoryMetadata.defaultBranch;

  const repositoryTree = await getRepositoryTree(
    owner,
    repository,
    selectedBranch
  );

  // Step 3: Filter relevant repository files.
  const filtered = filterRepositoryFiles(
    repositoryTree.entries
  );

  // Step 4: Retrieve selected file contents.
const prioritizedFiles = prioritizeFiles(filtered.files);

const retrieved = await getRepositoryFilesContent(
  owner,
  repository,
  prioritizedFiles,
  analysisOptions
);
  // Step 5: Analyze repository structure and configurations.
  const analysis = analyzeRepository(retrieved.files);

  return {
    repository: {
      name: repositoryMetadata.name,
      fullName: repositoryMetadata.fullName,
      description: repositoryMetadata.description,
      defaultBranch: repositoryMetadata.defaultBranch,
      analyzedBranch: selectedBranch,
      htmlUrl: repositoryMetadata.htmlUrl,
    },

    source: {
      commitSha: repositoryTree.commitSha,
      treeSha: repositoryTree.treeSha,
      truncated: repositoryTree.truncated,
      totalEntries: repositoryTree.totalCount,
    },

    retrieval: {
      filtering: filtered.stats,
      files: retrieved.stats,
      failures: retrieved.failures,
    },

    analysis,
  };
};

module.exports = {
  analyzeGitHubRepository,
};
