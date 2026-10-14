import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const buildDir = path.join(rootDir, "build");

// Bun imports the TypeScript schema directly. The previous command compiled
// with `tsc --outFile /dev/stdout` and eval'd the AMD bundle in a shell
// string. cmd.exe does not treat single quotes as quotes, and tsc cannot
// write /dev/stdout on Windows, so the script exited 1 and left an empty
// analytics-schema.json.
function loadSchema(schemaPath) {
  const importer = [
    `import schema from ${JSON.stringify(pathToFileURL(schemaPath).href)};`,
    "if (schema === undefined || schema === null) {",
    '  console.error("analytics-schema.ts has no default export");',
    "  process.exit(1);",
    "}",
    "process.stdout.write(JSON.stringify(schema));",
  ].join("\n");

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["-e", importer], {
      cwd: rootDir,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const errorText = Buffer.concat(stderr).toString("utf8").trim();
      if (code !== 0) {
        reject(new Error(errorText || `schema import exited ${code}`));
        return;
      }
      resolve(Buffer.concat(stdout).toString("utf8"));
    });
  });
}

async function buildAnalyticsSchema() {
  try {
    console.log("Generating analytics schema...");
    const analyticsSchemaPath = path.join(rootDir, "src", "analytics-schema.ts");
    const outputPath = path.join(buildDir, "analytics-schema.json");
    fs.mkdirSync(buildDir, { recursive: true });
    const raw = (await loadSchema(analyticsSchemaPath)).trim();
    JSON.parse(raw);
    fs.writeFileSync(outputPath, `${raw}\n`);
    console.log("✅ Analytics schema generated successfully");
  } catch (error) {
    console.error("❌ Analytics schema generation failed:", error.message);
    process.exit(1);
  }
}

buildAnalyticsSchema();
