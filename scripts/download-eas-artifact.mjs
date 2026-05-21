import { createWriteStream, mkdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const [jsonPath = "build/eas-build.json", outputDir = "build"] = process.argv.slice(2);

const readBuild = () => {
  const raw = readFileSync(jsonPath, "utf8").trim();
  if (!raw) {
    throw new Error(`EAS build output is empty: ${jsonPath}`);
  }

  const parsed = JSON.parse(raw);
  const builds = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.builds)
      ? parsed.builds
      : Array.isArray(parsed?.data)
        ? parsed.data
        : [parsed];

  const android =
    builds.find((b) => String(b?.platform ?? "").toUpperCase() === "ANDROID") ??
    builds.find((b) => String(b?.platform ?? "").toUpperCase() === "android") ??
    builds[0];

  if (!android) {
    throw new Error(`No build entry in EAS output: ${jsonPath}`);
  }

  return android;
};

const findArtifactUrl = (build) =>
  [
    build?.artifacts?.buildUrl,
    build?.artifacts?.applicationArchiveUrl,
    build?.applicationArchiveUrl,
    build?.applicationArchiveUrl,
    build?.buildUrl,
  ].find((value) => typeof value === "string" && value.startsWith("http"));

const getFilename = (url, response) => {
  const disposition = response.headers.get("content-disposition") ?? "";
  const dispositionMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (dispositionMatch?.[1]) {
    return dispositionMatch[1];
  }

  const pathFile = basename(new URL(url).pathname);
  if (extname(pathFile)) {
    return pathFile;
  }

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/vnd.android.package-archive")
    ? "eas-build.apk"
    : "eas-build.aab";
};

const build = readBuild();
const status = build?.status ?? "unknown";

if (status !== "FINISHED" && status !== "finished") {
  console.error("[EAS] Build did not finish successfully:", JSON.stringify(build, null, 2));
  process.exit(1);
}

const artifactUrl = findArtifactUrl(build);

if (!artifactUrl) {
  console.error("[EAS] No artifact URL. Full build JSON:", JSON.stringify(build, null, 2));
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

const response = await fetch(artifactUrl);
if (!response.ok || !response.body) {
  throw new Error(`Failed to download EAS artifact: ${response.status} ${response.statusText}`);
}

const outputPath = join(outputDir, getFilename(artifactUrl, response));
await pipeline(Readable.fromWeb(response.body), createWriteStream(outputPath));

console.log(`Downloaded EAS artifact to ${outputPath}`);
