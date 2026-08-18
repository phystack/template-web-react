import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const buildDir = path.join(rootDir, "build");

// Generate schema from TypeScript using @phystack/ts-schema
async function buildSchema() {
  try {
    console.log("Generating settings schema...");

    // Run ts-schema CLI to generate schema.json from src/schema.ts
    const { stdout, stderr } = await execAsync(
      `bunx ts-schema ${path.join(rootDir, "src/schema.ts")} ${buildDir}`,
      { cwd: rootDir }
    );

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log("✅ Schema generated successfully");
  } catch (error) {
    console.error("❌ Schema generation failed:", error.message);
    process.exit(1);
  }
}

buildSchema();
