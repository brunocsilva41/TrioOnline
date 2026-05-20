const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "../../..");
const envPath = path.join(rootDir, ".env");
const fallbackPath = path.join(rootDir, ".env.example");
const sourcePath = fs.existsSync(envPath) ? envPath : fallbackPath;

if (fs.existsSync(sourcePath)) {
  for (const line of fs.readFileSync(sourcePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-env.cjs <command> [...args]");
  process.exit(1);
}

const result = spawnSync(command, args, {
  cwd: path.resolve(__dirname, ".."),
  env: process.env,
  shell: true,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
