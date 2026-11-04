
const path = require("path");

const {
  analyzeConfigurations,
  detectFrameworks,
} = require("./configurationAnalyzer");

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
  Dockerfile: "Docker",
  "docker-compose.yml": "Docker Compose",
  "docker-compose.yaml": "Docker Compose",
  Makefile: "Make",
  Jenkinsfile: "Jenkins",
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

const normalizeDependencyName = (name) =>
  name.trim().toLowerCase().replace(/_/g, "-");

const detectProjectTechnologies = (filePaths) => {
  const detected = new Set();

  for (const filePath of filePaths) {
    const normalizedPath = normalizeFilePath(filePath);
    const fileName = getFileName(filePath);

    if (CONFIG_FILE_MAP[fileName]) {
      detected.add(CONFIG_FILE_MAP[fileName]);
    }

    if (
      normalizedPath.startsWith(".github/workflows/") &&
      (fileName.endsWith(".yml") || fileName.endsWith(".yaml"))
    ) {
      detected.add("GitHub Actions");
    }

    if (
      normalizedPath.startsWith(".github/workflows/") &&
      /\.(yml|yaml)$/i.test(fileName)
    ) {
      detected.add("CI/CD");
    }

    if (
      normalizedPath.startsWith(".gitlab-ci") ||
      fileName === ".gitlab-ci.yml"
    ) {
      detected.add("GitLab CI");
    }

    if (
      fileName === "Jenkinsfile" ||
      normalizedPath.includes("jenkins")
    ) {
      detected.add("Jenkins");
    }

    if (
      fileName === "Dockerfile" ||
      fileName.startsWith("docker-compose.")
    ) {
      detected.add("Docker");
    }

    if (
      fileName.endsWith(".tf") ||
      fileName.endsWith(".tfvars")
    ) {
      detected.add("Terraform");
    }

    if (
      normalizedPath.startsWith("k8s/") ||
      normalizedPath.startsWith("kubernetes/")
    ) {
      detected.add("Kubernetes");
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

// Built-in Python modules should not be reported as external dependencies.
const PYTHON_BUILTINS = new Set([
  "abc", "argparse", "asyncio", "base64", "collections",
  "concurrent", "contextlib", "copy", "csv", "dataclasses",
  "datetime", "decimal", "email", "enum", "functools",
  "hashlib", "heapq", "io", "itertools", "json", "logging",
  "math", "multiprocessing", "operator", "os", "pathlib",
  "pickle", "platform", "random", "re", "shutil", "signal",
  "socket", "sqlite3", "statistics", "string", "subprocess",
  "sys", "tempfile", "threading", "time", "typing", "unittest",
  "urllib", "uuid", "warnings", "xml", "zipfile",
]);

const JAVASCRIPT_BUILTINS = new Set([
  "assert", "buffer", "child_process", "crypto", "events",
  "fs", "http", "https", "module", "net", "os", "path",
  "process", "stream", "timers", "url", "util", "worker_threads",
]);

const extractPythonDependencies = (content) => {
  const dependencies = new Set();

  const importPattern =
    /^\s*import\s+([A-Za-z_][\w.]*)/gm;

  const fromPattern =
    /^\s*from\s+([A-Za-z_][\w.]*)\s+import\s+/gm;

  for (const match of content.matchAll(importPattern)) {
    const rootModule = match[1].split(".")[0].toLowerCase();

    if (!PYTHON_BUILTINS.has(rootModule)) {
      dependencies.add(normalizeDependencyName(rootModule));
    }
  }

  for (const match of content.matchAll(fromPattern)) {
    const rootModule = match[1].split(".")[0].toLowerCase();

    if (!PYTHON_BUILTINS.has(rootModule)) {
      dependencies.add(normalizeDependencyName(rootModule));
    }
  }

  return [...dependencies];
};

const extractJavaScriptDependencies = (content) => {
  const dependencies = new Set();

  const importPattern =
    /\bimport\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

  const requirePattern =
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;

  const dynamicImportPattern =
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  const addDependency = (modulePath) => {
    if (
      !modulePath ||
      modulePath.startsWith(".") ||
      modulePath.startsWith("/") ||
      modulePath.startsWith("#")
    ) {
      return;
    }

    if (modulePath.startsWith("node:")) {
      return;
    }

    const parts = modulePath.split("/");
    const packageName = modulePath.startsWith("@")
      ? parts.slice(0, 2).join("/")
      : parts[0];

    if (
      packageName &&
      !JAVASCRIPT_BUILTINS.has(packageName.toLowerCase())
    ) {
      dependencies.add(normalizeDependencyName(packageName));
    }
  };

  for (const match of content.matchAll(importPattern)) {
    addDependency(match[1]);
  }

  for (const match of content.matchAll(requirePattern)) {
    addDependency(match[1]);
  }

  for (const match of content.matchAll(dynamicImportPattern)) {
    addDependency(match[1]);
  }

  return [...dependencies];
};

const analyzeSourceDependencies = (files) => {
  const dependencies = new Set();

  for (const file of files) {
    if (
      !file ||
      typeof file.path !== "string" ||
      typeof file.content !== "string"
    ) {
      continue;
    }

    const extension = path.extname(file.path).toLowerCase();

    let detected = [];

    if (extension === ".py") {
      detected = extractPythonDependencies(file.content);
    } else if (
      [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"].includes(
        extension
      )
    ) {
      detected = extractJavaScriptDependencies(file.content);
    }

    detected.forEach((dependency) => dependencies.add(dependency));
  }

  return [...dependencies].sort();
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

  const configurationAnalysis = analyzeConfigurations(files);

  // Dependencies from source code and dependency manifests.
  const sourceDependencies = analyzeSourceDependencies(files);

  const dependencies = [
    ...new Set([
      ...configurationAnalysis.dependencies,
      ...sourceDependencies,
    ]),
  ].sort();

  // Frameworks from configuration files and source imports.
  const frameworks = detectFrameworks(dependencies);

  const technologies = [
    ...new Set([
      ...detectProjectTechnologies(filePaths),
      ...frameworks,
    ]),
  ].sort();

  return {
    summary: {
      totalFiles: files.length,
      totalLanguages: languages.length,
      totalDirectories: directories.length,
      totalConfigurations: configurationAnalysis.configurationCount,
      totalDependencies: dependencies.length,
      totalTechnologies: technologies.length,
    },

    languages,
    directories,
    technologies,
    configurationFiles,

    configurations: configurationAnalysis.configurations,
    dependencies,
    frameworks,
  };
};

module.exports = {
  analyzeRepository,
  analyzeLanguages,
  detectProjectTechnologies,
  getTopLevelDirectories,
  getLanguageFromPath,
  getConfigurationFiles,
  analyzeSourceDependencies,
  extractPythonDependencies,
  extractJavaScriptDependencies,
};
