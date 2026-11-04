
const path = require("path");

const normalizeFilePath = (filePath) =>
  filePath.replace(/\\/g, "/").replace(/^\/+/, "");

const getFileName = (filePath) =>
  path.posix.basename(normalizeFilePath(filePath));

const getExtension = (filePath) =>
  path.posix.extname(filePath).toLowerCase();

const ENTRY_POINT_PATTERNS = [
  /^server\.(js|mjs|cjs|ts)$/i,
  /^index\.(js|mjs|cjs|ts)$/i,
  /^main\.(py|java|go|rs|cpp|c|kt)$/i,
  /^app\.(py|js|ts|jsx|tsx)$/i,
  /^manage\.py$/i,
  /^wsgi\.py$/i,
  /^asgi\.py$/i,
  /^cli\.(js|ts|py)$/i,
  /^worker\.(js|ts|py)$/i,
];

const FRONTEND_MARKERS = new Set([
  "index.html",
  "vite.config.js",
  "vite.config.ts",
  "next.config.js",
  "next.config.ts",
  "angular.json",
  "vue.config.js",
]);

const BACKEND_MARKERS = new Set([
  "server.js",
  "server.ts",
  "app.py",
  "main.py",
  "manage.py",
  "pom.xml",
  "build.gradle",
  "go.mod",
]);

const ML_DEPENDENCIES = new Set([
  "numpy",
  "pandas",
  "scikit-learn",
  "sklearn",
  "tensorflow",
  "torch",
  "keras",
  "xgboost",
  "opencv-python",
  "transformers",
]);

const getProjectType = ({ files, analysis }) => {
  const paths = files.map((file) =>
    normalizeFilePath(file.path).toLowerCase()
  );

  const fileNames = new Set(paths.map(getFileName));

  const dependencies = new Set(
    (analysis?.dependencies || []).map((dependency) =>
      dependency.toLowerCase()
    )
  );

  const hasFrontend =
    [...FRONTEND_MARKERS].some((marker) => fileNames.has(marker)) ||
    dependencies.has("react") ||
    dependencies.has("vue") ||
    dependencies.has("@angular/core") ||
    dependencies.has("svelte");

  const hasBackend =
    [...BACKEND_MARKERS].some((marker) => fileNames.has(marker)) ||
    dependencies.has("express") ||
    dependencies.has("fastapi") ||
    dependencies.has("django") ||
    dependencies.has("flask") ||
    dependencies.has("@nestjs/core");

  const hasML =
    [...ML_DEPENDENCIES].some((dependency =>
      dependencies.has(dependency)
    )) ||
    paths.some((filePath) =>
      /(^|\/)(notebooks?|models?|datasets?)(\/|$)/i.test(filePath)
    );

  const hasPackageManifest = fileNames.has("package.json");
  const hasPythonManifest =
    fileNames.has("requirements.txt") ||
    fileNames.has("pyproject.toml");

  if (hasFrontend && hasBackend) {
    return "Full Stack";
  }

  if (hasML && !hasFrontend && !hasBackend) {
    return "Machine Learning";
  }

  if (hasFrontend) {
    return "Frontend";
  }

  if (hasBackend) {
    return "Backend";
  }

  if (hasPackageManifest || hasPythonManifest) {
    return "Application";
  }

  if (
    fileNames.has("readme.md") ||
    fileNames.has("license") ||
    paths.some((filePath) => filePath.startsWith("src/"))
  ) {
    return "Library";
  }

  return "Other";
};

const detectEntryPoints = (files) => {
  const entryPoints = [];

  for (const file of files) {
    if (!file || typeof file.path !== "string") {
      continue;
    }

    const normalizedPath = normalizeFilePath(file.path);
    const fileName = getFileName(normalizedPath);

    const matchesPattern = ENTRY_POINT_PATTERNS.some((pattern) =>
      pattern.test(fileName)
    );

    const isRootEntry =
      !normalizedPath.includes("/") &&
      ["index.html", "index.js", "index.ts", "main.py"].includes(
        fileName.toLowerCase()
      );

    const isFrontendEntry =
      fileName.toLowerCase() === "index.html" &&
      normalizedPath.split("/").length <= 2;

    if (matchesPattern || isRootEntry || isFrontendEntry) {
      entryPoints.push(normalizedPath);
    }
  }

  return [...new Set(entryPoints)].sort();
};

const detectExpressRoutes = (content, filePath) => {
  const routes = [];

  const pattern =
    /\b(?:app|router)\.(get|post|put|patch|delete|options|head|all|use)\s*\(\s*["'`]([^"'`]+)["'`]/g;

  for (const match of content.matchAll(pattern)) {
    routes.push({
      method: match[1].toUpperCase(),
      path: match[2],
      framework: "Express",
      file: filePath,
    });
  }

  return routes;
};

const detectFastApiRoutes = (content, filePath) => {
  const routes = [];

  const pattern =
    /@\w+\.(get|post|put|patch|delete|options|head)\s*\(\s*["'`]([^"'`]+)["'`]/g;

  for (const match of content.matchAll(pattern)) {
    routes.push({
      method: match[1].toUpperCase(),
      path: match[2],
      framework: "FastAPI",
      file: filePath,
    });
  }

  return routes;
};

const detectApiRoutes = (files) => {
  const routes = [];

  for (const file of files) {
    if (
      !file ||
      typeof file.path !== "string" ||
      typeof file.content !== "string"
    ) {
      continue;
    }

    const extension = getExtension(file.path);

    if ([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(extension)) {
      routes.push(...detectExpressRoutes(file.content, file.path));
    }

    if (extension === ".py") {
      routes.push(...detectFastApiRoutes(file.content, file.path));
    }
  }

  const uniqueRoutes = new Map();

  for (const route of routes) {
    const key = `${route.framework}:${route.method}:${route.path}:${route.file}`;
    uniqueRoutes.set(key, route);
  }

  return [...uniqueRoutes.values()].sort((a, b) =>
    `${a.file}:${a.method}:${a.path}`.localeCompare(
      `${b.file}:${b.method}:${b.path}`
    )
  );
};

const detectArchitecture = (files) => {
  const directoryNames = new Set();

  for (const file of files) {
    if (!file || typeof file.path !== "string") {
      continue;
    }

    const segments = normalizeFilePath(file.path).split("/");

    for (const segment of segments.slice(0, -1)) {
      directoryNames.add(segment.toLowerCase());
    }
  }

  const knownLayers = [
    "controllers",
    "services",
    "routes",
    "models",
    "repositories",
    "middleware",
    "utils",
    "components",
    "pages",
    "hooks",
    "views",
    "schemas",
    "config",
  ];

  const detectedLayers = knownLayers.filter((layer) =>
    directoryNames.has(layer)
  );

  const architecture = [];

  if (
    directoryNames.has("controllers") &&
    directoryNames.has("services") &&
    directoryNames.has("routes")
  ) {
    architecture.push("Layered Backend Architecture");
  }

  if (
    directoryNames.has("components") &&
    (directoryNames.has("pages") || directoryNames.has("app"))
  ) {
    architecture.push("Component-Based Frontend");
  }

  if (
    directoryNames.has("services") &&
    directoryNames.has("repositories")
  ) {
    architecture.push("Service-Repository Pattern");
  }

  return {
    detectedLayers,
    architecture:
      architecture.length > 0
        ? architecture
        : ["Architecture not clearly identifiable"],
  };
};

const analyzeRepositoryIntelligence = ({ files, analysis }) => {
  if (!Array.isArray(files)) {
    throw new TypeError("Repository intelligence expects files array.");
  }

  const projectType = getProjectType({ files, analysis });
  const entryPoints = detectEntryPoints(files);
  const apiRoutes = detectApiRoutes(files);
  const architecture = detectArchitecture(files);

  return {
    projectType,
    entryPoints,
    apiRoutes,
    architecture,
    statistics: {
      entryPoints: entryPoints.length,
      apiRoutes: apiRoutes.length,
      architectureLayers: architecture.detectedLayers.length,
    },
  };
};

module.exports = {
  analyzeRepositoryIntelligence,
  getProjectType,
  detectEntryPoints,
  detectApiRoutes,
  detectExpressRoutes,
  detectFastApiRoutes,
  detectArchitecture,
};
