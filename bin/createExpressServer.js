"use strict";

const path = require("path");
const commander = require("commander");
const spawn = require("cross-spawn");
const fs = require("fs");

export const init = () => {
  const program = new commander.Command("service-express")
    .version("1.0.0")
    .arguments("<project-directory>")
    .usage(`${chalk.green("<project-directory>")} [options]`)
    .action((name) => {
      projectName = name;
    })
    .allowUnknownOption()
    .parse(process.argv);
};

const createServer = ({ name, verbose, scriptsVersion, template }) => {
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
    JSON.stringify(packageJson, null, 2) + os.EOL
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
};
