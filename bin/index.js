#! /usr/bin/env node
console.log("Hello World!");

var fs = require("fs");

const dirs = [
  "modules",
  "models",
  "configs",
  "middleware",
  "routes.ts",
  "server.ts",
];

fs.mkdirSync(`./src`, { recursive: true });

dirs.map((dir) => {
  if (!fs.existsSync(`./src/${dir}`)) {
    if (!!dir.endsWith(".ts")) {
      fs.writeFileSync(`./src/${dir}`, "");
    } else {
      fs.mkdirSync(`./src/${dir}`, { recursive: true });
    }
  }
});
