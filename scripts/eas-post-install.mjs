import { spawnSync } from "node:child_process";

const isAndroidBuild = process.env.EAS_BUILD_PLATFORM === "android";

if (!isAndroidBuild) {
  console.log("Skipping web asset prep for non-Android EAS build.");
  process.exit(0);
}

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

console.log("[eas-post-install] Building web assets for Capacitor Android…");
run("npm", ["run", "build"]);
run("node", ["scripts/prepare-android-web-assets.mjs"]);
console.log("[eas-post-install] Done.");
