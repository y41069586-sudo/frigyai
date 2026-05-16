#!/usr/bin/env node
/**
 * Wendet Health-Sync Native-Konfiguration an (AndroidManifest / Info.plist).
 * Voraussetzung: npx cap add android && npx cap add ios (einmalig, nach npm run build).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const ANDROID_PERMS = `
    <!-- Frigy Health Connect (von scripts/setup-health-native.mjs) -->
    <uses-permission android:name="android.permission.health.READ_WEIGHT" />
    <uses-permission android:name="android.permission.health.WRITE_WEIGHT" />
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.health.READ_TOTAL_CALORIES_BURNED" />
    <uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
`;

const ANDROID_QUERIES = `
    <package android:name="com.google.android.apps.healthdata" />
`;

const ANDROID_INTENT_FILTERS = `
        <!-- Health Connect: Android 13 und älter -->
        <intent-filter>
            <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
        </intent-filter>
        <!-- Health Connect: Android 14+ -->
        <intent-filter>
            <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
            <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
        </intent-filter>
`;

const IOS_PLIST_KEYS = `
	<key>NSHealthShareUsageDescription</key>
	<string>Frigy benötigt Zugriff auf deine Gesundheitsdaten, um Gewicht, Schritte und Kalorien zu synchronisieren.</string>
	<key>NSHealthUpdateUsageDescription</key>
	<string>Frigy möchte dein Gewicht in Apple Health speichern.</string>
`;

function patchAndroid() {
  const manifestPath = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml");
  if (!fs.existsSync(manifestPath)) {
    console.log("⏭  android/ fehlt — zuerst: npm run build && npx cap add android && npx cap sync");
    return false;
  }

  let xml = fs.readFileSync(manifestPath, "utf8");
  let changed = false;

  if (!xml.includes("health.READ_WEIGHT")) {
    xml = xml.replace(/<manifest[^>]*>/, (m) => m + ANDROID_PERMS);
    changed = true;
  }

  if (!xml.includes("com.google.android.apps.healthdata")) {
    if (xml.includes("<queries>")) {
      xml = xml.replace("</queries>", `  ${ANDROID_QUERIES.trim()}\n  </queries>`);
    } else {
      xml = xml.replace(
        "</manifest>",
        `  <queries>${ANDROID_QUERIES}\n  </queries>\n</manifest>`,
      );
    }
    changed = true;
  }

  if (!xml.includes("VIEW_PERMISSION_USAGE")) {
    xml = xml.replace(/<activity([^>]*MainActivity[^>]*)>/, (m) => m + ANDROID_INTENT_FILTERS);
    if (!xml.includes("VIEW_PERMISSION_USAGE")) {
      xml = xml.replace(/<activity([^>]*android:name="\.MainActivity"[^>]*)>/, (m) => m + ANDROID_INTENT_FILTERS);
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(manifestPath, xml);
    console.log("✅ AndroidManifest.xml — Health Connect Berechtigungen ergänzt");
  } else {
    console.log("✓  AndroidManifest.xml — bereits konfiguriert");
  }
  return true;
}

function patchIos() {
  const plistPath = path.join(root, "ios", "App", "App", "Info.plist");
  if (!fs.existsSync(plistPath)) {
    console.log("⏭  ios/ fehlt — auf dem Mac: npm run build && npx cap add ios && npx cap sync");
    return false;
  }

  let plist = fs.readFileSync(plistPath, "utf8");
  if (plist.includes("NSHealthShareUsageDescription")) {
    console.log("✓  Info.plist — bereits konfiguriert");
    return true;
  }

  plist = plist.replace("</dict>", `${IOS_PLIST_KEYS}</dict>`);
  fs.writeFileSync(plistPath, plist);
  console.log("✅ Info.plist — HealthKit Texte ergänzt");
  console.log("   → In Xcode noch: Signing & Capabilities → + HealthKit");
  return true;
}

console.log("\nFrigy — Health Sync Native Setup\n");
patchAndroid();
patchIos();
console.log("\nDanach: npm run cap:sync\n");
