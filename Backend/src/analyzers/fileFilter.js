
const path = require("path");

const DEFAULT_MAX_FILE_SIZE = 500 * 1024;

const IGNORED_DIRECTORIES = new Set([
  ".git",
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

const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".ico", ".svg", ".mp4", ".mov", ".mp3",
  ".wav", ".zip", ".rar", ".7z", ".tar",
  ".gz", ".exe", ".dll", ".so", ".bin",
  ".woff", ".woff2", ".ttf", ".otf",
  ".pdf", ".doc", ".docx", ".ppt", ".pptx",
]);

const SUPPORTED_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".java", ".c", ".h", ".cpp", ".hpp",
  ".cs", ".go", ".rs", ".php", ".rb", ".swift",
  ".kt", ".kts", ".scala", ".dart",
  ".vue", ".svelte",
  ".html", ".css", ".scss", ".sass", ".less",
  ".sql", ".sh", ".bash", ".ps1",
  ".json", ".yaml", ".yml", ".toml", ".xml",
  ".ini", ".conf", ".properties", ".env",
  ".md", ".mdx", ".txt",
  ".graphql", ".gql", ".proto",
  ".csv",
  ".ipynb",
]);

const SUPPORTED_FILENAMES = new Set([
  "dockerfile",
  "makefile",
  "procfile",
  "jenkinsfile",
  "gemfile",
  "rakefile",
  "brewfile",
  "justfile",
  ".gitignore",
  ".dockerignore",
  ".editorconfig",
  ".npmrc",
  ".nvmrc",
  ".prettierrc",
  ".eslintrc",
  "license",
]);

const IGNORED_FILENAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
]);

const normalizePath = (filePath) =>
  filePath.replace(/\\/g, "/").replace(/^\/+/, "");

const isSupportedFile = (entry, options = {}) => {
  if (!entry || typeof entry.path !== "string") return false;
  if (entry.type !== "blob") return false;
  if (entry.mode === "120000") return false;

  const maxFileSize =
    options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

  if (
    typeof entry.size === "number" &&
    entry.size > maxFileSize
  ) {
    return false;
  }

  const normalizedPath = normalizePath(entry.path);
  const segments = normalizedPath.split("/");
  const fileName = path.posix.basename(normalizedPath);
  const lowerFileName = fileName.toLowerCase();
  const extension = path.posix.extname(lowerFileName);

  if (
    segments.some((segment) =>
      IGNORED_DIRECTORIES.has(segment.toLowerCase())
    )
  ) {
    return false;
  }

  if (IGNORED_FILENAMES.has(lowerFileName)) {
    return false;
  }

  if (IGNORED_EXTENSIONS.has(extension)) {
    return false;
  }

  if (
    /\.(min)\.(js|css)$/i.test(lowerFileName)
  ) {
    return false;
  }

  return (
    SUPPORTED_FILENAMES.has(lowerFileName) ||
    SUPPORTED_EXTENSIONS.has(extension)
  );
};

const filterRepositoryFiles = (entries, options = {}) => {
  if (!Array.isArray(entries)) {
    throw new TypeError("Repository entries must be an array.");
  }

  const files = entries.filter((entry) =>
    isSupportedFile(entry, options)
  );

  return {
    files,
    stats: {
      totalEntries: entries.length,
      supportedFiles: files.length,
      ignoredEntries: entries.length - files.length,
    },
  };
};

module.exports = {
  filterRepositoryFiles,
  isSupportedFile,
  DEFAULT_MAX_FILE_SIZE,
};
