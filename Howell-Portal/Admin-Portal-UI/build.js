#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const versionFilePath = path.join(__dirname, "apps", "operator-portal", "src", "config", "buildVersion.ts");
const versionPattern = /export const OPERATOR_PORTAL_BUILD_VERSION = "(\d+)\.(\d+)\.(\d+)";/;

function readVersionFile() {
  const source = fs.readFileSync(versionFilePath, "utf8");
  const match = source.match(versionPattern);
  if (!match) {
    throw new Error(
      `Unable to parse build version from ${versionFilePath}. Expected OPERATOR_PORTAL_BUILD_VERSION = "x.y.z".`,
    );
  }

  return {
    source,
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

function isSemver(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

function writeVersion(source, nextVersion) {
  const nextSource = source.replace(
    versionPattern,
    `export const OPERATOR_PORTAL_BUILD_VERSION = "${nextVersion}";`,
  );
  fs.writeFileSync(versionFilePath, nextSource);
}

function printHelp() {
  console.log(`Usage:
  node build.js show
  node build.js major
  node build.js minor
  node build.js patch
  node build.js set <x.y.z>

Rules:
  major -> x.0.0 (breaking/major feature update)
  minor -> 0.x.0 (minor feature/enhancement)
  patch -> 0.0.x (bug fix/patch)
`);
}

function main() {
  const command = (process.argv[2] || "show").toLowerCase();
  const { source, major, minor, patch } = readVersionFile();
  let nextVersion = `${major}.${minor}.${patch}`;

  if (command === "show") {
    console.log(`Current build: V${nextVersion}`);
    return;
  }

  if (command === "major") {
    nextVersion = `${major + 1}.0.0`;
  } else if (command === "minor") {
    nextVersion = `${major}.${minor + 1}.0`;
  } else if (command === "patch") {
    nextVersion = `${major}.${minor}.${patch + 1}`;
  } else if (command === "set") {
    const requestedVersion = process.argv[3];
    if (!requestedVersion || !isSemver(requestedVersion)) {
      throw new Error('Invalid version for "set". Use format x.y.z');
    }
    nextVersion = requestedVersion;
  } else if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  } else {
    throw new Error(`Unknown command "${command}". Run "node build.js help".`);
  }

  writeVersion(source, nextVersion);
  console.log(`Updated build version to V${nextVersion}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
