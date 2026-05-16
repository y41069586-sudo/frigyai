# Fridgie Native App Setup (iOS & Android)

Diese Anleitung erklärt, wie du die native iOS/Android App mit Capacitor baust und Google Fit / Apple Health integrierst.

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

## Schritt 3: Apple Health Setup (iOS)

### 3.1 HealthKit Capability aktivieren

1. Öffne das iOS-Projekt in Xcode:
   ```bash
   npx cap open ios
   ```

2. Wähle das Projekt im Navigator → Target "App"

3. Gehe zu "Signing & Capabilities" → "+" → "HealthKit"

4. Aktiviere:
   - ✅ Clinical Health Records (optional)
   - ✅ Background Delivery

### 3.2 Info.plist konfigurieren

Füge folgende Keys in `ios/App/App/Info.plist` hinzu:

```xml
<key>NSHealthShareUsageDescription</key>
<string>Fridgie benötigt Zugriff auf deine Gesundheitsdaten, um Gewicht, Schritte und verbrannte Kalorien zu synchronisieren.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Fridgie möchte dein Gewicht in Apple Health speichern, um deine Fortschritte zu tracken.</string>
```

### 3.3 HealthKit Plugin (bereits im Projekt)

Plugins: `@perfood/capacitor-healthkit` (iOS), `@devmaxime/capacitor-health-connect` (Android).

Nach `npx cap add ios` / `npx cap add android`:

```bash
npm run health:native
npm run cap:sync
```

`health:native` trägt Info.plist- und AndroidManifest-Einträge automatisch ein. In Xcode noch **HealthKit** unter Signing & Capabilities aktivieren.

## Schritt 4: Google Fit Setup (Android)

### 4.1 Health Connect / Google Fit

Ab Android 14 verwendet Android "Health Connect" anstelle von Google Fit.

1. Öffne `android/app/src/main/AndroidManifest.xml`

2. Füge Berechtigungen hinzu:

```xml
<!-- Health Connect permissions -->
<uses-permission android:name="android.permission.health.READ_WEIGHT" />
<uses-permission android:name="android.permission.health.WRITE_WEIGHT" />
<uses-permission android:name="android.permission.health.READ_STEPS" />
<uses-permission android:name="android.permission.health.READ_TOTAL_CALORIES_BURNED" />

<!-- Activity Recognition for steps -->
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
```

3. Füge Intent-Filter für Health Connect hinzu:

```xml
<intent-filter>
    <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
</intent-filter>

<queries>
    <package android:name="com.google.android.apps.healthdata" />
</queries>
```

### 4.2 Google Fit API aktivieren (für ältere Android-Versionen)

1. Gehe zur [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere die "Fitness API"
4. Erstelle OAuth 2.0 Credentials
5. Füge SHA-1 Fingerprint hinzu:
   ```bash
   cd android
   ./gradlew signingReport
   ```

## Schritt 5: Push Notifications (optional)

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

## Schritt 6: App bauen und testen

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

## Schritt 7: Production Build

### iOS (App Store):

```bash
# 1. Projekt öffnen
npx cap open ios

# 2. In Xcode:
#    - Archive (Product → Archive)
#    - Distribute App → App Store Connect
```

### Android (Play Store):

```bash
# 1. Signierungsschlüssel erstellen (einmalig)
keytool -genkey -v -keystore fridgie-release.keystore -alias fridgie -keyalg RSA -keysize 2048 -validity 10000

# 2. In android/app/build.gradle konfigurieren

# 3. Release APK/AAB bauen
cd android
./gradlew bundleRelease

# APK liegt in: android/app/build/outputs/bundle/release/
```

## Troubleshooting

### HealthKit zeigt keine Daten
- Prüfe ob Berechtigungen in den Einstellungen erteilt wurden
- HealthKit funktioniert nicht im iOS Simulator - nutze ein echtes Gerät

### Google Fit Verbindung schlägt fehl
- Prüfe SHA-1 Fingerprint in Google Cloud Console
- Stelle sicher, dass Google Fit auf dem Gerät installiert ist

### Build-Fehler nach Update
```bash
npx cap sync
cd ios && pod install && cd ..
```

## Support

Bei Fragen oder Problemen erstelle ein Issue auf GitHub oder kontaktiere das Fridgie-Team.
