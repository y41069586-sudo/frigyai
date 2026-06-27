import { spawnSync } from "node:child_process";

const platform = process.env.EAS_BUILD_PLATFORM;

if (platform !== "android" && platform !== "ios") {
  console.log("Skipping web asset prep (EAS_BUILD_PLATFORM not android/ios).");
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

console.log(`[eas-post-install] Building web assets for Capacitor ${platform}…`);
run("npm", ["run", "build"]);
if (platform === "android") {
  run("node", ["scripts/prepare-android-web-assets.mjs"]);
} else {
  run("npx", ["cap", "sync", "ios"]);
}
console.log("[eas-post-install] Done.");
