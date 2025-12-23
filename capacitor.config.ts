import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.38287fffa52b43ffb7d74ca0ea11b4ff',
  appName: 'Fridgie',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#4ADE80",
    },
  },
  server: {
    url: 'https://38287fff-a52b-43ff-b7d7-4ca0ea11b4ff.lovableproject.com?forceHideBadge=true',
    cleartext: true
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
