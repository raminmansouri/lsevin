const fs = require("node:fs");
const path = require("node:path");

// Base directories
const frontendBaseDir = "frontend/webapp/src/";
const frontendComponentsDir = `${frontendBaseDir}components/`;
const backendBaseDir = "src/";

const readFolders = (dir, baseDirOverride) => {
  try {
    return fs.readdirSync(`${baseDirOverride ?? frontendComponentsDir}${dir}`);
  } catch (e) {
    return [];
  }
};

const readComponents = (relativePath, baseDir = frontendComponentsDir) => {
  let reactFiles = [];

  const folderPath = !relativePath.startsWith(baseDir)
    ? path.join(baseDir, relativePath)
    : relativePath;

  try {
    const files = fs.readdirSync(folderPath);

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        reactFiles = reactFiles.concat(readComponents(filePath, ""));
      } else if (path.extname(file) === ".tsx") {
        reactFiles.push(path.basename(file).replace(".tsx", ""));
      }
    });
  } catch (error) {
    console.error("Error while searching for .tsx files:", error);
  }

  return reactFiles;
};

// Read .NET backend components
const readDotNetDirectories = (baseDir, subdirs = [""]) => {
  let results = [];
  for (const subdir of subdirs) {
    try {
      const dirPath = path.join(baseDir, subdir);
      const dirs = fs
        .readdirSync(dirPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => (subdir ? `${subdir}/${dirent.name}` : dirent.name));

      results = results.concat(dirs);
    } catch (e) {
      console.error(`Error reading directory ${baseDir}/${subdir}:`, e);
    }
  }
  return results;
};

// Frontend components
const pages = readFolders("", `${frontendBaseDir}app/`);
const features = readFolders("", `${frontendBaseDir}features/`);
const hooks = readFolders("", `${frontendBaseDir}hooks/`);
const stores = readFolders("", `${frontendBaseDir}stores/`);
const configs = readFolders("", `${frontendBaseDir}config/`);
const types = readFolders("", `${frontendBaseDir}types/`);
const libs = readFolders("", `${frontendBaseDir}lib/`);

// Try to read specific component directories if they exist
let entities = [];
try {
  entities = readFolders("entities", frontendComponentsDir)
    .map((entity) => [
      entity,
      ...readFolders(`entities/${entity}/ui`, frontendComponentsDir),
    ])
    .flat();
} catch (e) {}

let sharedAPIs = [];
try {
  sharedAPIs = readFolders("shared/api", frontendComponentsDir)
    .filter((f) => !f.endsWith(".ts") && f !== "lib")
    .map((f) => `${f}-api`);
} catch (e) {}

let sharedUI = [];
try {
  sharedUI = readComponents("ui");
} catch (e) {}

let sharedLibs = [];
try {
  sharedLibs = readFolders("shared/lib", frontendComponentsDir).map(
    (f) => `${f}-lib`,
  );
} catch (e) {}

// Backend components
const apiProjects = readDotNetDirectories(backendBaseDir, ["API"]);
const buildingBlocks = readDotNetDirectories(backendBaseDir, [
  "BuildingBlocks",
]);
const modules = readDotNetDirectories(backendBaseDir, ["Modules"]);

const workflows = readFolders(".github/workflows", "").map(
  (f) => `${f.replace(".yaml", "")}-workflow`,
);

module.exports = {
  types: [
    { value: "feat", name: "feat: A new feature" },
    { value: "fix", name: "fix: A bug fix" },
    { value: "docs", name: "docs: Documentation only changes" },
    {
      value: "style",
      name: "style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)",
    },
    {
      value: "refactor",
      name: "refactor: A code change that neither fixes a bug nor adds a feature",
    },
    {
      value: "build",
      name: "build: Changes that affect the build system or external dependencies",
    },
    {
      value: "ci",
      name: "ci: Changes to our CI configuration files and scripts",
    },
    { value: "perf", name: "perf: A code change that improves performance" },
    {
      value: "test",
      name: "test: Adding missing tests or correcting existing tests",
    },
    {
      value: "chore",
      name: "chore: Build or documentation generation, another infrastructure change or something else that does not affect the source code",
    },
    { value: "revert", name: "revert: Revert to a commit" },
  ],

  scopes: [
    // Global scopes
    "project",
    "mono-repo",

    // Backend scopes
    "---",
    "backend",
    "---",
    "api",
    ...apiProjects,
    "---",
    "building-blocks",
    ...buildingBlocks,
    "---",
    "modules",
    ...modules,

    // Frontend scopes
    "---",
    "frontend",
    "---",
    "app",
    ...pages,
    "---",
    "features",
    ...features,
    "---",
    "components",
    ...entities,
    ...sharedUI,
    "---",
    "hooks",
    ...hooks,
    "---",
    "stores",
    ...stores,
    "---",
    "config",
    ...configs,
    "---",
    "types",
    ...types,
    "---",
    "lib",
    ...libs,
    ...sharedLibs,
    "---",
    "api",
    ...sharedAPIs,
  ],

  scopeOverrides: {
    build: [
      "vite",
      "deps",
      "deps-dev",
      ".npmrc",
      "tsconfig",
      "tailwind",
      "dotnet",
      "nuget",
      "sln",
    ],
    chore: [
      "eslint",
      "repo",
      "cz",
      "package.json",
      "generate-react-cli",
      "csproj",
      "solution",
    ],
    ci: ["dependabot", ...workflows],
  },

  usePreparedCommit: true,
  allowTicketNumber: false,
  isTicketNumberRequired: false,
  ticketNumberPrefix: "TICKET-",
  ticketNumberRegExp: "\\d{1,5}",

  messages: {
    type: "Select the type of change that you're committing:",
    scope: "\nDenote the SCOPE of this change (optional):",
    customScope: "Denote the SCOPE of this change:",
    subject: "Write a SHORT, IMPERATIVE tense description of the change:\n",
    body: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
    breaking: "List any BREAKING CHANGES (optional):\n",
    footer:
      "List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n",
    confirmCommit: "Are you sure you want to proceed with the commit above?",
  },

  allowCustomScopes: true,
  allowBreakingChanges: ["feat", "fix"],
  subjectLimit: 100,
};
