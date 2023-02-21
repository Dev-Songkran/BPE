"use strict";

const path = require("path");
const commander = require("commander");
const spawn = require("cross-spawn");
const fs = require("fs-extra");
const chalk = require("chalk");

let projectName;

const init = () => {
  const program = new commander.Command("service-express")
    .version("1.0.0")
    .arguments("<project-directory>")
    .usage(`${chalk.green("<project-directory>")} [options]`)
    .action((name) => {
      projectName = name;
    })
    .allowUnknownOption()
    .parse(process.argv);

  createServer(projectName);
};

const createServer = (name) => {
  const root = path.resolve(name);
  const appName = path.basename(root);

  fs.ensureDirSync(name);
  if (!isSafeToCreateProjectIn(root, name)) {
    process.exit(1);
  }

  console.log();
  console.log(`Creating a new Express Server in ${chalk.green(root)}.`);
  console.log();

  const packageJson = {
    name: appName,
    version: "1.0.0",
    private: true,
  };

  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  process.chdir(root);

  const dirs = [
    "modules",
    "models",
    "configs",
    "middleware",
    "routes.ts",
    "server.ts",
  ];

  const src = path.join(root, "src");
  fs.mkdirSync(src, { recursive: true });
  fs.writeFileSync(path.join(root, ".env"), "");

  dirs.map((dir) => {
    if (!!dir.endsWith(".ts")) {
      fs.writeFileSync(path.join(src, dir), "");
    } else {
      fs.mkdirSync(path.join(src, dir), { recursive: true });
    }
  });

  // INSTALL PACKAGES
  const allDependencies = ["express", "dayjs", "dotenv", "cors", "lodash"];
  const allDevDependencies = [
    "typescript",
    "tsconfig-paths",
    "ts-node",
    "nodemon",
    "@types/express",
    "@types/lodash",
  ];
  const command = "npm";

  const args = [
    "install",
    "--no-audit",
    "--save",
    "--save-exact",
    "--loglevel",
    "error",
  ].concat(allDependencies);

  const devArgs = ["install", "--no-audit", "--save-dev", "error"].concat(
    allDevDependencies
  );

  const child = spawn(command, args, { stdio: "inherit" });
  child.on("close", (code) => {
    if (code !== 0) {
      console.log("Aborting installation.");
      process.exit(1);
    }
  });

  const childDev = spawn(command, devArgs, { stdio: "inherit" });

  childDev.on("close", (code) => {
    if (code !== 0) {
      console.log("Aborting installation.");
      process.exit(1);
    }
  });

  console.log("🎉 Success installation.");
  console.log(`cd ${name}`);
};

function isSafeToCreateProjectIn(root, name) {
  const validFiles = [
    ".DS_Store",
    ".git",
    ".gitattributes",
    ".gitignore",
    ".gitlab-ci.yml",
    ".hg",
    ".hgcheck",
    ".hgignore",
    ".idea",
    ".npmignore",
    ".travis.yml",
    "docs",
    "LICENSE",
    "README.md",
    "mkdocs.yml",
    "Thumbs.db",
  ];
  // These files should be allowed to remain on a failed install, but then
  // silently removed during the next create.
  const errorLogFilePatterns = [
    "npm-debug.log",
    "yarn-error.log",
    "yarn-debug.log",
  ];
  const isErrorLog = (file) => {
    return errorLogFilePatterns.some((pattern) => file.startsWith(pattern));
  };

  const conflicts = fs
    .readdirSync(root)
    .filter((file) => !validFiles.includes(file))
    // IntelliJ IDEA creates module files before CRA is launched
    .filter((file) => !/\.iml$/.test(file))
    // Don't treat log files from previous installation as conflicts
    .filter((file) => !isErrorLog(file));

  if (conflicts.length > 0) {
    console.log(
      `The directory ${chalk.green(name)} contains files that could conflict:`
    );
    console.log();
    for (const file of conflicts) {
      try {
        const stats = fs.lstatSync(path.join(root, file));
        if (stats.isDirectory()) {
          console.log(`  ${chalk.blue(`${file}/`)}`);
        } else {
          console.log(`  ${file}`);
        }
      } catch (e) {
        console.log(`  ${file}`);
      }
    }
    console.log();
    console.log(
      "Either try using a new directory name, or remove the files listed above."
    );

    return false;
  }

  // Remove any log files from a previous installation.
  fs.readdirSync(root).forEach((file) => {
    if (isErrorLog(file)) {
      fs.removeSync(path.join(root, file));
    }
  });
  return true;
}

module.exports = { init };
