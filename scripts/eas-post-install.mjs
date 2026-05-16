import { appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const isAndroidBuild = process.env.EAS_BUILD_PLATFORM === "android";

if (!isAndroidBuild) {
  console.log("Skipping Android JDK setup for non-Android EAS build.");
  process.exit(0);
}

if (process.platform !== "linux") {
  console.log("Skipping Android JDK setup outside Linux EAS builder.");
  process.exit(0);
}

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("sudo", ["apt-get", "update"]);
run("sudo", ["apt-get", "install", "-y", "openjdk-21-jdk"]);

appendFileSync(
  "android/gradle.properties",
  "\norg.gradle.java.home=/usr/lib/jvm/java-21-openjdk-amd64\n",
);
