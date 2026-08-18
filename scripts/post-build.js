import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const buildDir = path.join(rootDir, "build");

// Copy schema files to build root with underscore prefix (omg-deploys format)
function copySchemaFiles() {
  const schemaPath = path.join(buildDir, "schema.json");
  const analyticsSchemaPath = path.join(buildDir, "analytics-schema.json");

  // Rename schema.json to _schema.json
  if (fs.existsSync(schemaPath)) {
    fs.copyFileSync(schemaPath, path.join(buildDir, "_schema.json"));
    console.log("✅ Copied schema.json → _schema.json");
  }

  // Rename analytics-schema.json to _meta-schema.json (legacy naming)
  if (fs.existsSync(analyticsSchemaPath)) {
    fs.copyFileSync(
      analyticsSchemaPath,
      path.join(buildDir, "_meta-schema.json")
    );
    console.log("✅ Copied analytics-schema.json → _meta-schema.json");
  }
}

// Generate asset-manifest.json for deployment compatibility
function generateAssetManifest() {
  const indexHtml = fs.readFileSync(path.join(buildDir, "index.html"), "utf-8");

  // Extract all script and link sources
  const scriptMatches = [...indexHtml.matchAll(/src="([^"]+)"/g)];
  const linkMatches = [...indexHtml.matchAll(/href="([^"]+\.js)"/g)];

  const files = {};
  const entrypoints = [];

  // Process scripts (main entrypoint)
  scriptMatches.forEach((match) => {
    let src = match[1];
    // Convert absolute to relative
    if (src.startsWith("/")) src = "." + src;

    const filename = path.basename(src);
    const name = filename.split(".")[0]; // Get name before hash
    files[`${name}.js`] = src;
    entrypoints.push(src);
  });

  // Process modulepreload links (chunks)
  linkMatches.forEach((match) => {
    let src = match[1];
    // Convert absolute to relative
    if (src.startsWith("/")) src = "." + src;

    const filename = path.basename(src);
    const name = filename.split(".")[0];
    files[`static/js/${filename}`] = src;
  });

  // Scan static directory for all files
  const staticDir = path.join(buildDir, "static");
  if (fs.existsSync(staticDir)) {
    function scanDir(dir, relativeBase) {
      fs.readdirSync(dir).forEach((item) => {
        const fullPath = path.join(dir, item);
        const relativePath = `${relativeBase}/${item}`;

        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath, relativePath);
        } else {
          // Don't add if already added from HTML parsing
          if (
            !files[relativePath] &&
            !files[`${path.basename(item).split(".")[0]}.js`]
          ) {
            files[relativePath] = `./${relativePath}`;
          }
        }
      });
    }

    scanDir(staticDir, "static");
  }

  // Add required files
  files["index.html"] = "./index.html";

  // Create manifest matching omg-deploys format
  const manifest = {
    files,
    entrypoints,
    phygrid_noframe: true, // Run directly without iframe wrapper
  };

  // Write asset-manifest.json
  fs.writeFileSync(
    path.join(buildDir, "asset-manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log("✅ Generated asset-manifest.json");
  console.log("   Files:", Object.keys(files).length);
  console.log("   Entrypoints:", entrypoints.length);
  console.log("   phygrid_noframe: true");
}

// Copy package.json to build directory
function copyPackageJson() {
  fs.copyFileSync(
    path.join(rootDir, "package.json"),
    path.join(buildDir, "package.json")
  );
  console.log("✅ Copied package.json to build directory");
}

// Run all post-build tasks
copySchemaFiles();
generateAssetManifest();
copyPackageJson();

console.log("✅ Post-build processing complete");
