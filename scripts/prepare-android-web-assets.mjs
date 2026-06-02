import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

const appConfig = {
  appId: "com.frigy.app",
  appName: "Fridgie",
  webDir: "dist",
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#4ADE80",
    },
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#000000",
  },
  android: {
    backgroundColor: "#000000",
    allowMixedContent: true,
  },
};

const plugins = [
  {
    pkg: "@capacitor/browser",
    classpath: "com.capacitorjs.plugins.browser.BrowserPlugin",
  },
  {
    pkg: "@capacitor/local-notifications",
    classpath: "com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin",
  },
  {
    pkg: "@capacitor/push-notifications",
    classpath: "com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin",
  },
];

const publicDir = "android/app/src/main/assets/public";
const assetsDir = "android/app/src/main/assets";
const xmlDir = "android/app/src/main/res/xml";

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
mkdirSync(assetsDir, { recursive: true });
mkdirSync(xmlDir, { recursive: true });

cpSync("dist", publicDir, { recursive: true });
writeFileSync(`${assetsDir}/capacitor.config.json`, `${JSON.stringify(appConfig, null, 2)}\n`);
writeFileSync(`${assetsDir}/capacitor.plugins.json`, `${JSON.stringify(plugins, null, 2)}\n`);
writeFileSync(
  `${xmlDir}/config.xml`,
  `<?xml version='1.0' encoding='utf-8'?>
<widget version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
  <access origin="*" />
</widget>
`,
);

console.log(`Copied web assets into ${publicDir}`);
