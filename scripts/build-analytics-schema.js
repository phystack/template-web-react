import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const buildDir = path.join(rootDir, "build");

// Started by `bun scripts/build-analytics-schema.js`. Bun imports the
// TypeScript schema in this process. The old shell command compiled with
// `tsc --outFile /dev/stdout` and eval'd the bundle, which fails on Windows
// and leaves an empty analytics-schema.json.
async function buildAnalyticsSchema() {
  try {
    console.log("Generating analytics schema...");
    const analyticsSchemaPath = path.join(
      rootDir,
      "src",
      "analytics-schema.ts"
    );
    const outputPath = path.join(buildDir, "analytics-schema.json");
    const imported = await import(pathToFileURL(analyticsSchemaPath).href);
    const schema = imported.default;
    if (schema == null) {
      throw new Error("analytics-schema.ts has no default export");
    }
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(schema)}\n`);
    console.log("✅ Analytics schema generated successfully");
  } catch (error) {
    console.error("❌ Analytics schema generation failed:", error.message);
    process.exit(1);
  }
}

buildAnalyticsSchema();
