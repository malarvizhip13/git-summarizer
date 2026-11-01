
const path = require("path");
const {
  analyzeConfigurations,
} = require("./configurationAnalyzer");

// File extension to programming language mapping.
const LANGUAGE_MAP = {
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".py": "Python",
  ".java": "Java",
  ".go": "Go",
  ".rs": "Rust",
  ".cpp": "C++",
  ".cc": "C++",
  ".c": "C",
  ".h": "C/C++",
  ".cs": "C#",
  ".php": "PHP",
  ".rb": "Ruby",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".kts": "Kotlin",
  ".dart": "Dart",
  ".scala": "Scala",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sass": "Sass",
  ".less": "Less",
  ".sql": "SQL",
  ".sh": "Shell",
  ".bash": "Shell",
  ".ps1": "PowerShell",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".xml": "XML",
  ".md": "Markdown",
  ".mdx": "MDX",
  ".toml": "TOML",
  ".vue": "Vue",
  ".svelte": "Svelte",
};

// Important project and tooling files.
const CONFIG_FILE_MAP = {
  "package.json": "Node.js",
  "package-lock.json": "npm",
  "yarn.lock": "Yarn",
  "pnpm-lock.yaml": "pnpm",
  "requirements.txt": "Python",
  "pyproject.toml": "Python",
  "Pipfile": "Python",
  "pom.xml": "Maven",
  "build.gradle": "Gradle",
  "build.gradle.kts": "Gradle",
  "Cargo.toml": "Rust",
  "go.mod": "Go",
  "composer.json": "PHP",
  "Gemfile": "Ruby",
  "Dockerfile": "Docker",
  "docker-compose.yml": "Docker Compose",
  "docker-compose.yaml": "Docker Compose",
  "Makefile": "Make",
  "Jenkinsfile": "Jenkins",
  "terraform.tf": "Terraform",
  "main.tf": "Terraform",
  "vite.config.js": "Vite",
  "vite.config.ts": "Vite",
  "next.config.js": "Next.js",
  "next.config.ts": "Next.js",
  "angular.json": "Angular",
  "vue.config.js": "Vue CLI",
};

const normalizeFilePath = (filePath) =>
  filePath.replace(/\\/g, "/");

const getFileName = (filePath) =>
  path.posix.basename(normalizeFilePath(filePath));

const getLanguageFromPath = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[extension] || null;
};

const detectProjectTechnologies = (filePaths) => {
  const detected = new Set();

  for (const filePath of filePaths) {
    const normalizedPath = normalizeFilePath(filePath);
    const fileName = getFileName(filePath);

    if (CONFIG_FILE_MAP[fileName]) {
      detected.add(CONFIG_FILE_MAP[fileName]);
    }

    const isGitHubWorkflow =
      normalizedPath.startsWith(".github/workflows/") &&
      (fileName.endsWith(".yml") ||
        fileName.endsWith(".yaml"));

    if (isGitHubWorkflow) {
      detected.add("GitHub Actions");
    }
  }

  return [...detected].sort();
};

const getTopLevelDirectories = (filePaths) => {
  const directories = new Set();

  for (const filePath of filePaths) {
    const segments = normalizeFilePath(filePath).split("/");

    if (segments.length > 1) {
      directories.add(segments[0]);
    }
  }

  return [...directories].sort();
};

const analyzeLanguages = (filePaths) => {
  const counts = {};

  for (const filePath of filePaths) {
    const language = getLanguageFromPath(filePath);

    if (language) {
      counts[language] = (counts[language] || 0) + 1;
    }
  }

  const total = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0
  );

  return Object.entries(counts)
    .map(([language, files]) => ({
      language,
      files,
      percentage:
        total === 0
          ? 0
          : Number(((files / total) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.files - a.files);
};

const getConfigurationFiles = (filePaths) => {
  return filePaths
    .filter((filePath) =>
      Object.prototype.hasOwnProperty.call(
        CONFIG_FILE_MAP,
        getFileName(filePath)
      )
    )
    .sort();
};

const analyzeRepository = (files) => {
  if (!Array.isArray(files)) {
    throw new TypeError("Repository files must be an array.");
  }

  const filePaths = files.map((file) => {
    if (
      !file ||
      typeof file.path !== "string" ||
      !file.path.trim()
    ) {
      throw new TypeError(
        "Every repository file must have a valid path."
      );
    }

    return file.path;
  });

  const languages = analyzeLanguages(filePaths);
  const directories = getTopLevelDirectories(filePaths);
  const configurationFiles = getConfigurationFiles(filePaths);

  // Analyze actual configuration file contents.
  const configurationAnalysis = analyzeConfigurations(files);

  // Combine filename-based and dependency-based detection.
  const technologies = [
    ...new Set([
      ...detectProjectTechnologies(filePaths),
      ...configurationAnalysis.frameworks,
    ]),
  ].sort();

  return {
    summary: {
      totalFiles: files.length,
      totalLanguages: languages.length,
      totalDirectories: directories.length,
      totalConfigurations:
        configurationAnalysis.configurationCount,
      totalDependencies:
        configurationAnalysis.dependencies.length,
      totalTechnologies: technologies.length,
    },

    languages,
    directories,
    technologies,
    configurationFiles,

    configurations: configurationAnalysis.configurations,
    dependencies: configurationAnalysis.dependencies,
    frameworks: configurationAnalysis.frameworks,
  };
};

module.exports = {
  analyzeRepository,
  analyzeLanguages,
  detectProjectTechnologies,
  getTopLevelDirectories,
  getLanguageFromPath,
  getConfigurationFiles,
};
