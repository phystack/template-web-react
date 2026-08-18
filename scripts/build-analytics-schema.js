import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const buildDir = path.join(rootDir, "build");

// Generate analytics schema by compiling TypeScript and extracting the default export
async function buildAnalyticsSchema() {
  try {
    console.log("Generating analytics schema...");

    const analyticsSchemaPath = path.join(rootDir, "src/analytics-schema.ts");
    const outputPath = path.join(buildDir, "analytics-schema.json");

    // Compile and extract the default export using tsc + Node eval
    const command = `bunx tsc ${analyticsSchemaPath} --moduleResolution node --skipLibCheck --outFile /dev/stdout -m amd | node -e 'a={};eval("define=(_,d,c)=>{c(a,a,...d.slice(2).map(require));console.log(JSON.stringify(a.default))};" + require("fs").readFileSync("/dev/stdin","utf8"))' > ${outputPath}`;

    const { stdout, stderr } = await execAsync(command, { cwd: rootDir });

    if (stderr && !stderr.includes("(node:")) {
      // Ignore Node.js warnings
      console.error(stderr);
    }

    console.log("✅ Analytics schema generated successfully");
  } catch (error) {
    console.error("❌ Analytics schema generation failed:", error.message);
    process.exit(1);
  }
}

buildAnalyticsSchema();
