
const path = require("path");

const FRAMEWORK_DEPENDENCIES = {
  React: ["react"],
  "React DOM": ["react-dom"],
  Express: ["express"],
  "Next.js": ["next"],
  Vue: ["vue"],
  Angular: ["@angular/core"],
  Svelte: ["svelte"],
  FastAPI: ["fastapi"],
  Django: ["django"],
  Flask: ["flask"],
  Spring: ["spring-boot", "spring-core"],
  NestJS: ["@nestjs/core"],
  "React Native": ["react-native"],
};

const normalizeFilePath = (filePath) =>
  filePath.replace(/\\/g, "/");

const normalizeDependencyName = (name) =>
  name.trim().toLowerCase().replace(/_/g, "-");

const parsePackageJson = (content, filePath) => {
  try {
    const parsed = JSON.parse(content);

    const dependencies = {
      ...parsed.dependencies,
      ...parsed.devDependencies,
      ...parsed.peerDependencies,
      ...parsed.optionalDependencies,
    };

    return {
      file: filePath,
      packageName: parsed.name || null,
      packageVersion: parsed.version || null,
      dependencies: Object.keys(dependencies)
        .map(normalizeDependencyName)
        .sort(),
      scripts: Object.keys(parsed.scripts || {}).sort(),
    };
  } catch {
    return {
      file: filePath,
      error: "Invalid package.json format.",
    };
  }
};

const parseRequirementsTxt = (content, filePath) => {
  const dependencies = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("#") &&
        !line.startsWith("-") &&
        !line.startsWith("!")
    )
    .map((line) => {
      const match = line.match(/^([A-Za-z0-9_.-]+)/);
      return match ? normalizeDependencyName(match[1]) : null;
    })
    .filter(Boolean);

  return {
    file: filePath,
    dependencies: [...new Set(dependencies)].sort(),
  };
};

const parsePyprojectToml = (content, filePath) => {
  const dependencies = new Set();

  // Parse common PEP 621 dependencies:
  // dependencies = ["fastapi", "uvicorn>=0.20"]
  const dependencyBlock = content.match(
    /^\s*dependencies\s*=\s*\[([\s\S]*?)\]/m
  );

  if (dependencyBlock) {
    const matches = dependencyBlock[1].matchAll(
      /["']([A-Za-z0-9_.-]+)(?:\[[^\]]*\])?(?:[<>=!~;][^"']*)?["']/g
    );

    for (const match of matches) {
      dependencies.add(normalizeDependencyName(match[1]));
    }
  }

  // Parse Poetry dependencies:
  // [tool.poetry.dependencies]
  // fastapi = "^0.100"
  const poetryBlock = content.match(
    /^\s*\[tool\.poetry\.dependencies\]\s*([\s\S]*?)(?=^\s*\[|$)/m
  );

  if (poetryBlock) {
    for (const line of poetryBlock[1].split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/);

      if (match && match[1].toLowerCase() !== "python") {
        dependencies.add(normalizeDependencyName(match[1]));
      }
    }
  }

  return {
    file: filePath,
    dependencies: [...dependencies].sort(),
  };
};

const detectFrameworks = (dependencyNames) => {
  const dependencySet = new Set(
    dependencyNames.map(normalizeDependencyName)
  );

  const frameworks = [];

  for (const [framework, dependencies] of Object.entries(
    FRAMEWORK_DEPENDENCIES
  )) {
    if (
      dependencies.some((dependency) =>
        dependencySet.has(normalizeDependencyName(dependency))
      )
    ) {
      frameworks.push(framework);
    }
  }

  return frameworks.sort();
};

const analyzeConfigurations = (files) => {
  if (!Array.isArray(files)) {
    throw new TypeError("Configuration analyzer expects an array.");
  }

  const configurations = [];
  const allDependencies = new Set();

  for (const file of files) {
    if (
      !file ||
      typeof file.path !== "string" ||
      typeof file.content !== "string"
    ) {
      continue;
    }

    const normalizedPath = normalizeFilePath(file.path);
    const fileName = path.posix.basename(normalizedPath);

    let result = null;

    if (fileName === "package.json") {
      result = parsePackageJson(file.content, normalizedPath);
    } else if (fileName === "requirements.txt") {
      result = parseRequirementsTxt(file.content, normalizedPath);
    } else if (fileName === "pyproject.toml") {
      result = parsePyprojectToml(file.content, normalizedPath);
    }

    if (!result) {
      continue;
    }

    if (Array.isArray(result.dependencies)) {
      result.dependencies.forEach((dependency) =>
        allDependencies.add(normalizeDependencyName(dependency))
      );
    }

    configurations.push(result);
  }

  const dependencies = [...allDependencies].sort();

  return {
    configurationCount: configurations.length,
    configurations,
    dependencies,
    frameworks: detectFrameworks(dependencies),
  };
};

module.exports = {
  analyzeConfigurations,
  parsePackageJson,
  parseRequirementsTxt,
  parsePyprojectToml,
  detectFrameworks,
};
