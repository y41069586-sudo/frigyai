import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.frigy.app',
  appName: 'Fridgie',
  webDir: 'dist',
  /** Deep link scheme (also in ios/App/App/Info.plist + AndroidManifest) */
  // Stripe redirect: frigy://callback?subscription=success
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
    contentInset: 'automatic',
    backgroundColor: '#000000',
  },
  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
  }
};

export default config;
