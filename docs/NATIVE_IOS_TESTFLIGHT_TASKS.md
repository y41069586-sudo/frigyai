# Native iOS TestFlight — Reality Check & Task List

**Stand:** Architektur-Phase abgeschlossen. Fokus: erster erfolgreicher nativer Build → TestFlight → echte Screens.

---

## Reality Check

### Was existiert (`ios-swiftui/` — 44 Dateien)

| Bereich | Dateien | Status |
|---------|---------|--------|
| App Entry | `FrigyNativeApp.swift`, `RootView.swift` | Scaffold, kompilierbar (theoretisch) |
| Navigation | `AppRouter`, `MainTabCoordinator`, `TabRoots`, `DeepLinkParser`, `AppRoute` | Vollständig verdrahtet |
| Shell | `MainShellView`, `GlassTabBar` | iOS 26 Liquid Glass APIs |
| Onboarding | Coordinator + Rules + Telemetry + Skeleton | Logik fertig, **UI = Skeleton** |
| Auth | `SupabaseAuthService` (SPM), `AuthSpikeView` | Spike, kein Production-UI |
| Screens | `HomeDashboardView`, `MealPlansView`, `ShoppingListView`, `TrackerLogMealView` | Placeholder mit Glass |
| Tests | `DeepLinkParserTests`, `OnboardingCoordinatorTests` | Unit tests vorhanden |
| Xcode | `project.yml` (XcodeGen), **kein committed `.xcodeproj`** | CI generiert via `xcodegen` |

### Was noch **nie** auf einem Mac kompiliert wurde

- Kein `FrigyNative.xcodeproj` im Repo (by design — XcodeGen auf CI/Mac)
- Keine lokale/Xcode-Build-Logs
- Kein TestFlight-Upload des nativen Binaries
- Capacitor-Workflow (`ios-build`) baut weiterhin **WKWebView**, nicht SwiftUI

### P0-Blocker für ersten TestFlight-Build

| # | Blocker | Status |
|---|---------|--------|
| 1 | **Kein Codemagic-Workflow für SwiftUI** | ✅ Behoben: `ios-swiftui-build` in `codemagic.yaml` |
| 2 | **Kein `FrigyNative.xcodeproj`** | ✅ CI: `scripts/codemagic-prepare-native-ios.sh` + XcodeGen |
| 3 | **Kein `Secrets.xcconfig` auf CI** | ✅ Generiert aus `VITE_SUPABASE_*` |
| 4 | **Fehlendes App Icon** | ✅ Placeholder `AppIcon.appiconset` |
| 5 | **iOS 26 + Xcode 26.4** | ⚠️ Codemagic `mac_mini_m2` + `xcode: 26.4` — muss verfügbar sein |
| 6 | **Code Signing** | ⚠️ Bestehendes Setup (`Frigy` + `frigy_distribution`) — unverändert |
| 7 | **Supabase SPM resolve** | ⚠️ Erster Build testet Netzwerk + Package Resolution |
| 8 | **RevenueCat** | ✅ Nicht required für `ios-swiftui-build` (bewusst später) |
| 9 | **Bundle ID `com.frigyapp.app`** | ⚠️ Ersetzt Capacitor-App im selben App Store Eintrag — bewusst |

### Bekannte Compile-Risiken (erster Build wird zeigen)

- `@ViewContent` → `@ViewBuilder` in `GlassComponents.swift` (gefixt)
- Supabase Swift SDK API-Drift (`signInWithIdToken`, `session(from:)`)
- `glassEffect` / `GlassEffectContainer` nur iOS 26 — Deployment Target korrekt gesetzt
- `DEVELOPMENT_TEAM` leer in `project.yml` — Codemagic `use-profiles` setzt Team

### Was **nicht** kompiliert werden muss (noch nicht gebaut)

- 57 Onboarding-UI-Screens (nur Skeleton)
- RevenueCat native SDK
- Supabase Edge Function Clients (Meal plans, Tracker API)
- Camera / Barcode / Analyze Flows

---

## Task-Liste bis erster TestFlight-Build

### Phase A — Build grün (P0, diese Woche)

- [x] **A1** Codemagic-Workflow `ios-swiftui-build` anlegen
- [x] **A2** `codemagic-prepare-native-ios.sh` (Secrets + XcodeGen)
- [x] **A3** `codemagic-verify-native-env.sh` (ohne npm/RevenueCat)
- [x] **A4** App Icon Placeholder
- [ ] **A5** Ersten `ios-swiftui-build` in Codemagic triggern
- [ ] **A6** Build-Fehler aus xcodebuild-Log beheben (iterativ)
- [ ] **A7** IPA in App Store Connect hochladen (TestFlight Internal)

### Phase B — Device QA (P0, nach grünem Build)

- [ ] **B1** App startet → Loading → Onboarding Skeleton oder Auth
- [ ] **B2** Tab-Switch: State Preservation (`TextField` in Home/Plans/Shopping)
- [ ] **B3** GlassTabBar: Morphing-Capsule, Tracker-Button, Safe Area
- [ ] **B4** Dark Mode + Reduce Transparency
- [ ] **B5** Keyboard: TabBar nicht verdeckt
- [ ] **B6** Deep Link `frigy://` + Universal Link `app.frigy.app`
- [ ] **B7** Apple Sign In + Google OAuth (echte Supabase Keys)
- [ ] **B8** Onboarding Coordinator: Next/Back/Resume nach Kill
- [ ] **B9** Telemetry JSON Export auf Device (QA Observability)

### Phase C — Erste echte Screens (P1)

Reihenfolge (3–5 Screens, maximaler Produktwert):

1. **Welcome** — Onboarding-Einstieg (ersetzt Skeleton-Start)
2. **Account Creation** — Apple/Google Buttons (Production-UI statt AuthSpike)
3. **Gender + Weight + Height** — WheelPicker, erster „wow“-Moment
4. **Home Dashboard** — echte Kalorien-Anzeige (statisch/mock → API)
5. **Profile** — Settings-Shell, Sign Out

- [ ] **C1** `OnboardingStepView` Factory — ein View pro Step, Skeleton fallback
- [ ] **C2** Welcome + Account Creation UI
- [ ] **C3** 3 Profile-Steps (Gender, Weight, Height)
- [ ] **C4** Home Dashboard mit Mock-Daten
- [ ] **C5** Onboarding-Flow mit echten Views verbinden (Router unverändert)

### Phase D — TestFlight extern (P1)

- [ ] **D1** TestFlight Internal Testing Gruppe
- [ ] **D2** Release Notes + Build-Nummer-Schema (`IOS_BUILD_NUMBER`)
- [ ] **D3** Externe Tester (2–3 Geräte, iOS 26)

### Phase E — RevenueCat (P2, erst nach C + B)

- [ ] **E1** RevenueCat Swift SDK in `project.yml`
- [ ] **E2** `SubscriptionService` native Implementation
- [ ] **E3** Paywall Screen (echtes UI)
- [ ] **E4** Restore Purchases + Sandbox QA

---

## Codemagic: Native SwiftUI Build starten

1. Codemagic → **frigyai** → Workflow **iOS Native SwiftUI Build**
2. Branch: `cursor/swiftui-architecture-refactor-e370` (oder `main` nach Merge)
3. Env-Gruppe `frigy` muss enthalten: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Signing unverändert: Profil `Frigy`, Zertifikat `frigy_distribution`
5. **Kein** `npm ci` / Vite — reiner Xcode-Build

```bash
# Lokal auf Mac (optional):
cd ios-swiftui
cp Config/Secrets.xcconfig.example Config/Secrets.xcconfig
# Keys setzen
./scripts/generate-xcodeproj.sh
open FrigyNative.xcodeproj
# Product → Archive
```

---

## Explizit out of scope (bis TestFlight grün)

- Keine weiteren Architektur-/Telemetry-/Rules-Refactorings
- Kein RevenueCat vor Phase E
- Keine 57 Onboarding-Screens auf einmal
- Capacitor-App nicht entfernen (läuft parallel bis Cutover)
