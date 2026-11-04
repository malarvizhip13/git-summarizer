
const path = require("path");

const {
  analyzeRepositoryIntelligence,
} = require("../analyzers/repositoryIntelligence");

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

const {
  generateRepositorySummary,
} = require("./aiService");


// =========================================================
// DEFAULT CONFIGURATION
// =========================================================

const DEFAULT_ANALYSIS_OPTIONS = {
  concurrency: 5,
  maxFiles: 50,
};

// =========================================================
// FILE PRIORITY CONFIGURATION
// =========================================================

const CONFIGURATION_PRIORITY = new Set([
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "cargo.toml",
  "go.mod",
  "composer.json",
  "gemfile",
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "angular.json",
  "tsconfig.json",
  "vite.config.js",
  "vite.config.ts",
]);

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".go",
  ".rs",
  ".cpp",
  ".c",
  ".cs",
  ".php",
  ".rb",
  ".swift",
  ".kt",
  ".dart",
]);

const DOCUMENTATION_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".rst",
  ".txt",
]);

const LOW_PRIORITY_PATH_SEGMENTS = new Set([
  "fixtures",
  "fixture",
  "examples",
  "example",
  "benchmarks",
  "benchmark",
  "coverage",
  "generated",
  "vendor",
  "dist",
  "build",
]);

const TEST_PATH_SEGMENTS = new Set([
  "test",
  "tests",
  "__tests__",
  "__mocks__",
]);

// =========================================================
// FILE PATH NORMALIZATION
// =========================================================

const normalizeFilePath = (filePath) => {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
};

// =========================================================
// DIRECTORY GROUPING
// =========================================================

const getDirectoryGroup = (filePath) => {
  const normalizedPath = normalizeFilePath(filePath);

  const directorySegments = path.posix
    .dirname(normalizedPath)
    .split("/")
    .filter((segment) => segment && segment !== ".");

  if (directorySegments.length === 0) {
    return "(root)";
  }

  return directorySegments.slice(0, 3).join("/");
};

// =========================================================
// FILE CLASSIFICATION AND PRIORITY
// =========================================================

const getFileDetails = (file) => {
  const normalizedPath = normalizeFilePath(file.path);

  const segments = normalizedPath.split("/");
  const fileName = path.posix.basename(normalizedPath);
  const lowerFileName = fileName.toLowerCase();

  const extension = path.posix.extname(normalizedPath).toLowerCase();

  const lowerSegments = segments.map((segment) =>
    segment.toLowerCase()
  );

  const isLowPriority = lowerSegments.some((segment) =>
    LOW_PRIORITY_PATH_SEGMENTS.has(segment)
  );

  const isTestFile =
    lowerSegments.some((segment) =>
      TEST_PATH_SEGMENTS.has(segment)
    ) ||
    /\.(test|spec)\.[^.]+$/i.test(fileName);

  const isConfiguration =
    CONFIGURATION_PRIORITY.has(lowerFileName);

  const isDocumentation =
    DOCUMENTATION_EXTENSIONS.has(extension) ||
    /^readme(\.|$)/i.test(fileName) ||
    /^changelog(\.|$)/i.test(fileName);

  const isSourceCode =
    SOURCE_EXTENSIONS.has(extension);

  let category = "other";

  if (isSourceCode && !isTestFile && !isLowPriority) {
    category = "source";
  } else if (isConfiguration) {
    category = "configuration";
  } else if (isDocumentation) {
    category = "documentation";
  } else if (isSourceCode) {
    category = "other";
  }

  let priority = 0;

  if (isLowPriority) {
    priority += 100;
  }

  if (isTestFile) {
    priority += 50;
  }

  if (category === "source") {
    if (
      lowerSegments.some((segment) =>
        ["src", "lib", "app", "core"].includes(segment)
      )
    ) {
      priority -= 20;
    }

    if (segments.length <= 2) {
      priority -= 10;
    }
  }

  if (category === "configuration") {
    priority += segments.length;
  }

  if (
    category === "documentation" &&
    /^readme(\.|$)/i.test(fileName)
  ) {
    priority -= 20;
  }

  return {
    file,
    category,
    priority,
    normalizedPath,
    directoryGroup: getDirectoryGroup(normalizedPath),
  };
};

// =========================================================
// DIRECTORY-AWARE SELECTION
// =========================================================

const selectDiverseFiles = (items, limit) => {
  if (limit <= 0 || items.length === 0) {
    return [];
  }

  const groups = new Map();

  for (const item of items) {
    const groupName = item.directoryGroup;

    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }

    groups.get(groupName).push(item);
  }

  const groupQueues = Array.from(groups.values());
  const selected = [];

  while (selected.length < limit) {
    let addedInThisRound = false;

    for (const queue of groupQueues) {
      if (selected.length >= limit) {
        break;
      }

      if (queue.length === 0) {
        continue;
      }

      selected.push(queue.shift());
      addedInThisRound = true;
    }

    if (!addedInThisRound) {
      break;
    }
  }

  return selected;
};

// =========================================================
// FILE SELECTION
// =========================================================

const prioritizeFiles = (files, maxFiles = 50) => {
  if (!Array.isArray(files)) {
    throw new TypeError("Files must be provided as an array.");
  }

  const safeMaxFiles =
    Number.isInteger(maxFiles) && maxFiles > 0
      ? maxFiles
      : DEFAULT_ANALYSIS_OPTIONS.maxFiles;

  const categorizedFiles = {
    source: [],
    configuration: [],
    documentation: [],
    other: [],
  };

  for (const file of files) {
    if (
      !file ||
      typeof file.path !== "string" ||
      !file.path.trim()
    ) {
      continue;
    }

    const details = getFileDetails(file);
    categorizedFiles[details.category].push(details);
  }

  const sortByPriority = (items) =>
    items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      return a.normalizedPath.localeCompare(b.normalizedPath);
    });

  for (const category of Object.keys(categorizedFiles)) {
    categorizedFiles[category] = sortByPriority(
      categorizedFiles[category]
    );
  }

  const quotas = {
    source: Math.floor(safeMaxFiles * 0.65),
    configuration: Math.floor(safeMaxFiles * 0.15),
    documentation: Math.floor(safeMaxFiles * 0.10),
    other: 0,
  };

  quotas.other =
    safeMaxFiles -
    quotas.source -
    quotas.configuration -
    quotas.documentation;

  const selected = [];
  const selectedPaths = new Set();

  for (const category of [
    "source",
    "configuration",
    "documentation",
    "other",
  ]) {
    const categorySelection = selectDiverseFiles(
      categorizedFiles[category],
      quotas[category]
    );

    for (const details of categorySelection) {
      selected.push(details);
      selectedPaths.add(details.normalizedPath);
    }
  }

  if (selected.length < safeMaxFiles) {
    const remainingFiles = Object.values(categorizedFiles)
      .flat()
      .filter(
        (details) =>
          !selectedPaths.has(details.normalizedPath)
      )
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }

        return a.normalizedPath.localeCompare(
          b.normalizedPath
        );
      });

    const remainingSelection = selectDiverseFiles(
      remainingFiles,
      safeMaxFiles - selected.length
    );

    for (const details of remainingSelection) {
      selected.push(details);
      selectedPaths.add(details.normalizedPath);
    }
  }

  const directoryDistribution = {};

  for (const item of selected) {
    directoryDistribution[item.directoryGroup] =
      (directoryDistribution[item.directoryGroup] || 0) + 1;
  }

  return {
    files: selected.map((details) => details.file),

    stats: {
      available: files.length,
      selected: selected.length,
      source: selected.filter(
        (item) => item.category === "source"
      ).length,
      configuration: selected.filter(
        (item) => item.category === "configuration"
      ).length,
      documentation: selected.filter(
        (item) => item.category === "documentation"
      ).length,
      other: selected.filter(
        (item) => item.category === "other"
      ).length,
      directoryGroups: Object.keys(directoryDistribution).length,
      directoryDistribution,
    },
  };
};

// =========================================================
// GITHUB REPOSITORY ANALYSIS
// =========================================================

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

  const {
    includeAiSummary = true,
    ...retrievalOptions
  } = options;

  if (typeof includeAiSummary !== "boolean") {
    throw new TypeError(
      "includeAiSummary must be a boolean."
    );
  }

  const analysisOptions = {
    ...DEFAULT_ANALYSIS_OPTIONS,
    ...retrievalOptions,
  };

  // Step 1: Retrieve repository metadata.
  const repositoryMetadata = await getRepository(
    owner,
    repository
  );

  const selectedBranch =
    branch || repositoryMetadata.defaultBranch;

  // Step 2: Retrieve repository file tree.
  const repositoryTree = await getRepositoryTree(
    owner,
    repository,
    selectedBranch
  );

  // Step 3: Filter unsupported and unnecessary files.
  const filtered = filterRepositoryFiles(
    repositoryTree.entries
  );
  console.log(
  "[GitHub Tree Entries]",
  JSON.stringify(repositoryTree.entries, null, 2)
);
  // Step 4: Prioritize files across repository directories.
  const selection = prioritizeFiles(
    filtered.files,
    analysisOptions.maxFiles
  );

  // Step 5: Retrieve selected file contents.
  const retrieved = await getRepositoryFilesContent(
    owner,
    repository,
    selection.files,
    analysisOptions
  );
  console.log("[Analysis Debug]", {
  repository: repositoryMetadata.fullName,
  treeEntries: repositoryTree.entries.length,
  filteredFiles: filtered.files.length,
  selectedFiles: selection.files.length,
  retrievedFiles: retrieved.files.length,
  retrievalFailures: retrieved.failures.length,
  sampleSelected: selection.files.slice(0, 5).map((file) => file.path),
  sampleRetrieved: retrieved.files.slice(0, 5).map((file) => file.path),
});
// Step 6: Perform static repository analysis.
const analysis = analyzeRepository(retrieved.files);

// Step 6.1: Analyze repository intelligence.
const intelligence = analyzeRepositoryIntelligence({
  files: retrieved.files,
  analysis,
});

  // Step 7: Prepare repository metadata.
  const repositoryResult = {
    name: repositoryMetadata.name,
    fullName: repositoryMetadata.fullName,
    description: repositoryMetadata.description,
    defaultBranch: repositoryMetadata.defaultBranch,
    analyzedBranch: selectedBranch,
    htmlUrl: repositoryMetadata.htmlUrl,
  };

  const sourceResult = {
    commitSha: repositoryTree.commitSha,
    treeSha: repositoryTree.treeSha,
    truncated: repositoryTree.truncated,
    totalEntries: repositoryTree.totalCount,
  };

  // Step 8: Prepare retrieval statistics.
  const retrievalResult = {
    filtering: filtered.stats,
    selection: selection.stats,
    files: retrieved.stats,
    failures: retrieved.failures,
  };

  // Step 9: Generate AI-powered repository summary.
  // AI failure must not discard successful static analysis.
  let aiSummary = null;

  if (includeAiSummary) {
    try {
      aiSummary = await generateRepositorySummary({
        repository: repositoryResult,
        source: sourceResult,
        retrieval: retrievalResult,
        analysis,
        files: retrieved.files,
      });

      aiSummary = {
        ...aiSummary,
        status: aiSummary.isComplete
          ? "completed"
          : "incomplete",
        error: null,
      };
    } catch (error) {
      const errorMessage =
        typeof error?.message === "string" &&
        error.message.trim()
          ? error.message
          : "AI summary generation failed.";

      console.error(
        "[Analysis] AI summary generation failed",
        {
          repository: repositoryMetadata.fullName,
          message: errorMessage,
        }
      );

      aiSummary = {
        status: "failed",
        summary: null,
        usage: null,
        durationMs: null,
        finishReason: "error",
        isComplete: false,
        error: errorMessage,
      };
    }
  }

return {
  repository: repositoryResult,
  source: sourceResult,
  retrieval: retrievalResult,
  analysis,
  intelligence,
  aiSummary,
};
};

// =========================================================
// MODULE EXPORTS
// =========================================================

module.exports = {
  analyzeGitHubRepository,
  prioritizeFiles,
};