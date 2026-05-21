import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.frigy.app',
  appName: 'Fridgie',
  webDir: 'dist',
  /** Deep links: frigy://callback (Stripe), frigy://signup?ref= (ChottuLink) */
  // Universal/App Links: VITE_CHOTTULINK_HOST + VITE_APP_WEB_HOST — see docs/CHOTTULINK_SETUP.md
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
