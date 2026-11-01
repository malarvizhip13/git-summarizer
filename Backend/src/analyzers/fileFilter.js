
/**
 * Repository File Filtering Engine
 *
 * Filters GitHub repository tree entries before source analysis.
 */

const DEFAULT_MAX_FILE_SIZE = 500 * 1024; // 500 KB

// Directories that should not be analyzed.
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".svn",
  ".hg",
  "node_modules",
  "vendor",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".output",
  ".cache",
  ".turbo",
  ".venv",
  "venv",
  "__pycache__",
  "target",
  "bin",
  "obj",
]);

// Extensions representing binary or non-source assets.
const IGNORED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".mp3",
  ".mp4",
  ".wav",
  ".avi",
  ".mov",
  ".pdf",
  ".zip",
  ".rar",
  ".7z",
  ".gz",
  ".tar",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".class",
  ".jar",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".db",
  ".sqlite",
]);

// Supported source, configuration and documentation extensions.
const SUPPORTED_EXTENSIONS = new Set([
  // Programming languages
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".py",
  ".java",
  ".c",
  ".h",
  ".cpp",
  ".hpp",
  ".cs",
  ".go",
  ".rs",
  ".php",
  ".rb",
  ".swift",
  ".kt",
  ".kts",
  ".scala",
  ".dart",
  ".vue",
  ".svelte",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".sql",
  ".sh",
  ".bash",
  ".ps1",

  // Configuration
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".xml",
  ".ini",
  ".conf",
  ".properties",
  ".env",
  ".md",
  ".mdx",
  ".txt",
  ".graphql",
  ".gql",
  ".proto",
]);

// Exact filenames without extensions that are useful for analysis.
const SUPPORTED_FILENAMES = new Set([
  "Dockerfile",
  "Makefile",
  "Procfile",
  "Jenkinsfile",
  "Gemfile",
  "Rakefile",
  "Brewfile",
  "Justfile",
  ".gitignore",
  ".dockerignore",
  ".editorconfig",
  ".npmrc",
  ".nvmrc",
  ".prettierrc",
  ".eslintrc",
  "LICENSE",
]);

// Files that are generally dependency lockfiles or generated bundles.
const IGNORED_FILENAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "bun.lock",
  "composer.lock",
  "Gemfile.lock",
  "Cargo.lock",
  "poetry.lock",
  "Pipfile.lock",
  "uv.lock",
  "npm-shrinkwrap.json",
]);

/**
 * Extract the file extension.
 */
const getExtension = (filePath) => {
  const fileName = filePath.split("/").pop();
  const extensionIndex = fileName.lastIndexOf(".");

  if (extensionIndex <= 0) {
    return "";
  }

  return fileName.slice(extensionIndex).toLowerCase();
};

/**
 * Check whether a path contains an ignored directory.
 */
const containsIgnoredDirectory = (filePath) => {
  const segments = filePath.split("/");

  return segments.some((segment) =>
    IGNORED_DIRECTORIES.has(segment.toLowerCase())
  );
};

/**
 * Determine whether a GitHub tree entry is suitable for analysis.
 */
const isSupportedFile = (entry, options = {}) => {
  const maxFileSize =
    options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

  if (!entry || typeof entry.path !== "string") {
    return false;
  }

  // Only regular Git blobs are considered.
  if (entry.type !== "blob") {
    return false;
  }

  // Ignore symbolic links.
  if (entry.mode === "120000") {
    return false;
  }

  const filePath = entry.path;
  const fileName = filePath.split("/").pop();
  const extension = getExtension(filePath);

  // Ignore dependency and generated directories.
  if (containsIgnoredDirectory(filePath)) {
    return false;
  }

  // Ignore dependency lockfiles.
  if (IGNORED_FILENAMES.has(fileName)) {
    return false;
  }

  // Ignore binary file extensions.
  if (IGNORED_EXTENSIONS.has(extension)) {
    return false;
  }

  // Ignore minified assets.
  if (
    /\.(min)\.(js|css)$/i.test(fileName)
  ) {
    return false;
  }

  // Ignore oversized files.
  if (
    typeof entry.size === "number" &&
    entry.size > maxFileSize
  ) {
    return false;
  }

  // Allow recognized files without extensions.
  if (SUPPORTED_FILENAMES.has(fileName)) {
    return true;
  }

  // Keep only supported extensions.
  return SUPPORTED_EXTENSIONS.has(extension);
};

/**
 * Filter a complete GitHub repository tree.
 *
 * @param {Array} entries - GitHub tree entries.
 * @param {Object} options - Optional filtering configuration.
 * @returns {Object} Filtered files and statistics.
 */
const filterRepositoryFiles = (entries, options = {}) => {
  if (!Array.isArray(entries)) {
    throw new TypeError(
      "Repository tree entries must be an array."
    );
  }

  const files = entries.filter((entry) =>
    isSupportedFile(entry, options)
  );

  const directoriesCount = entries.filter(
    (entry) => entry.type === "tree"
  ).length;

  const totalFileEntries = entries.length - directoriesCount;

  return {
    files,
    stats: {
      totalEntries: entries.length,
      directories: directoriesCount,
      totalFileEntries,
      supportedFiles: files.length,
      ignoredFiles: totalFileEntries - files.length,
      maxFileSize:
        options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
    },
  };
};

module.exports = {
  filterRepositoryFiles,
  isSupportedFile,
  DEFAULT_MAX_FILE_SIZE,
};
