import { createWriteStream, mkdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const [jsonPath = "build/eas-build.json", outputDir = "build"] = process.argv.slice(2);

const readBuild = () => {
  const raw = readFileSync(jsonPath, "utf8").trim();
  if (!raw) {
    throw new Error(`EAS build output is empty: ${jsonPath}`);
  }

  const parsed = JSON.parse(raw);
  const builds = Array.isArray(parsed) ? parsed : [parsed];
  return builds.find((build) => build?.platform === "ANDROID") ?? builds[0];
};

const findArtifactUrl = (build) =>
  [
    build?.artifacts?.buildUrl,
    build?.artifacts?.applicationArchiveUrl,
    build?.artifacts?.applicationArchivePath,
    build?.applicationArchiveUrl,
    build?.buildUrl,
  ].find((value) => typeof value === "string" && value.startsWith("http"));

const getFilename = (url, response) => {
  const disposition = response.headers.get("content-disposition") ?? "";
  const dispositionMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (dispositionMatch?.[1]) {
    return dispositionMatch[1];
  }

  const pathName = new URL(url).pathname;
  const pathFile = basename(pathName);
  if (extname(pathFile)) {
    return pathFile;
  }

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/vnd.android.package-archive")
    ? "eas-build.apk"
    : "eas-build.aab";
};

const build = readBuild();
const artifactUrl = findArtifactUrl(build);

if (!artifactUrl) {
  throw new Error(
    `No EAS Android artifact URL found. Build status: ${build?.status ?? "unknown"}`,
  );
}

mkdirSync(outputDir, { recursive: true });

const response = await fetch(artifactUrl);
if (!response.ok || !response.body) {
  throw new Error(`Failed to download EAS artifact: ${response.status} ${response.statusText}`);
}

const outputPath = join(outputDir, getFilename(artifactUrl, response));
await pipeline(Readable.fromWeb(response.body), createWriteStream(outputPath));

console.log(`Downloaded EAS artifact to ${outputPath}`);
