# Fridgie Native App Setup (iOS & Android)

Diese Anleitung erklärt, wie du die native iOS/Android App mit Capacitor baust. Premium-Abos laufen über **App Store / Google Play** (RevenueCat).

## Voraussetzungen

### Für iOS (Mac erforderlich):
- macOS mit Xcode 15+
- Apple Developer Account (für App Store Veröffentlichung)
- CocoaPods installiert (`sudo gem install cocoapods`)

### Für Android:
- Android Studio (Flamingo oder neuer)
- Java 17+
- Android SDK (API Level 24+)

## Schritt 1: Projekt klonen und vorbereiten

```bash
# 1. Exportiere das Projekt zu GitHub über "Export to Github" Button
# 2. Klone das Repository
git clone https://github.com/DEIN_USERNAME/DEIN_REPO.git
cd DEIN_REPO

# 3. Installiere Dependencies
npm install

# 4. Baue das Projekt
npm run build
```

## Schritt 2: Native Plattformen hinzufügen

```bash
# iOS hinzufügen
npx cap add ios

# Android hinzufügen
npx cap add android

# Projekt synchronisieren
npx cap sync
```

## Schritt 3: In-App-Abos (App Store & Play Store)

Native Builds verwenden **RevenueCat** (`@revenuecat/purchases-capacitor`).

1. RevenueCat-Projekt anlegen und iOS/Android-Apps verknüpfen.
2. Abo-Produkte in App Store Connect und Google Play Console erstellen.
3. Entitlement `premium` und Offering mit monthly/yearly in RevenueCat konfigurieren.
4. `.env` mit `VITE_REVENUECAT_API_KEY_IOS` / `ANDROID` füllen.
5. Supabase Edge Functions `sync-store-subscription` und `revenuecat-webhook` deployen.

Ausführliche Schritte: **[docs/STORE_BILLING_SETUP.md](docs/STORE_BILLING_SETUP.md)**

```bash
# Nach .env-Anpassung
npm run build
npx cap sync
```

## Schritt 4: Push Notifications (optional)

### iOS

1. Apple Developer Portal → Certificates → Push Notification
2. Erstelle APNs Key
3. Füge in `ios/App/App/AppDelegate.swift` hinzu:
   ```swift
   func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
       // Handle token
   }
   ```

### Android (Firebase)

1. Erstelle Firebase-Projekt
2. Lade `google-services.json` herunter
3. Lege in `android/app/` ab
4. Konfiguriere in `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

## Schritt 5: App bauen und testen

### iOS Simulator:
```bash
npx cap run ios
```

### Android Emulator:
```bash
npx cap run android
```

### Physisches Gerät:
```bash
# iOS (Gerät muss verbunden und entsperrt sein)
npx cap run ios --target=DEVICE_ID

# Android (Gerät muss USB-Debugging aktiviert haben)
npx cap run android --target=DEVICE_ID
```

## Schritt 6: Production Build

### iOS (App Store):

```bash
# 1. Projekt öffnen
npx cap open ios

# 2. In Xcode:
#    - Archive (Product → Archive)
#    - Distribute App → App Store Connect
```

### Android (Play Store):

Google Play **akzeptiert keine Debug-signierten** AAB/APK. Du brauchst einen **Release-/Upload-Keystore**.

```bash
# 1. Signierungsschlüssel erstellen (einmalig — Passwort sicher speichern!)
keytool -genkey -v -keystore frigy-release.keystore -alias frigy \
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Lokale Signing-Konfiguration (nicht committen)
cp android/keystore.properties.example android/keystore.properties
# storeFile, storePassword, keyAlias, keyPassword eintragen

# 3. Web-Build + Capacitor sync
npm run build
npx cap sync android

# 4. Release AAB bauen (Play Store)
cd android
./gradlew bundleRelease
# AAB: app/build/outputs/bundle/release/app-release.aab
```

**Codemagic:** Keystore unter Team → Code signing → Android keystores hochladen, Reference **`frigy_release`**. Details: `docs/CODEMAGIC.md` (Abschnitt Android).

## Troubleshooting

### Store-Kauf schlägt fehl
- RevenueCat Public Keys in `.env` gesetzt?
- Offering `current` mit monthly/yearly Packages in RevenueCat?
- Sandbox-Tester (iOS) / License Tester (Android) verwenden

### Build-Fehler nach Update
```bash
npx cap sync
cd ios && pod install && cd ..
```

## Support

Bei Fragen oder Problemen erstelle ein Issue auf GitHub oder kontaktiere das Fridgie-Team.
