import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function loadLocalEnv() {
    const rootDir = path.resolve(__dirname, "../../..");
    const envPath = path.join(rootDir, ".env");
    const fallbackPath = path.join(rootDir, ".env.example");
    const sourcePath = fs.existsSync(envPath) ? envPath : fallbackPath;

    if (!fs.existsSync(sourcePath)) return;

    const lines = fs.readFileSync(sourcePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
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

// Load env before creating Prisma instance
loadLocalEnv();

export const prisma = new PrismaClient();
export const databaseConfigured = Boolean(process.env.DATABASE_URL);
