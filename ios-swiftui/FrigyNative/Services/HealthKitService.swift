import Foundation
import SwiftUI

// MARK: - Shared auth status type (mirrors HKAuthorizationStatus)

enum HKAuthorizationStatus: Equatable {
    case notDetermined
    case denied
    case authorized
}

// MARK: - Real HealthKit service (requires com.apple.developer.healthkit entitlement)

#if canImport(HealthKit)
import HealthKit

@MainActor
final class HealthKitService: ObservableObject {
    static let shared = HealthKitService()

    @Published var stepsToday: Int = 0
    @Published var activeCaloriesToday: Int = 0
    @Published var authStatus: HKAuthorizationStatus = .notDetermined
    @Published var isAvailable: Bool = HKHealthStore.isHealthDataAvailable()
    // iOS never lets an app revoke its own HealthKit read access — only the user can,
    // in Settings. This flag is our app-local stand-in for "disconnected": once set,
    // we stop reading/displaying HealthKit data even though system authorization
    // technically remains granted.
    @Published private(set) var isLocallyConnected: Bool

    private static let connectedKey = "frigy.healthkit.locallyConnected"

    private let store = HKHealthStore()

    private let readTypes: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
    ]

    init() {
        // Default true so existing users who already authorized keep seeing their data.
        isLocallyConnected = UserDefaults.standard.object(forKey: Self.connectedKey) == nil
            ? true
            : UserDefaults.standard.bool(forKey: Self.connectedKey)
    }

    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            setLocallyConnected(true)
            await updateAuthStatus()
            await refresh()
        } catch {
            authStatus = .denied
        }
    }

    func disconnect() {
        setLocallyConnected(false)
        stepsToday = 0
        activeCaloriesToday = 0
    }

    func reconnect() async {
        setLocallyConnected(true)
        await refresh()
    }

    func refresh() async {
        guard HKHealthStore.isHealthDataAvailable(), isLocallyConnected else { return }
        await updateAuthStatus()
        guard authStatus == .authorized else { return }
        async let s = fetchToday(.stepCount, unit: .count())
        async let a = fetchToday(.activeEnergyBurned, unit: .kilocalorie())
        let (steps, active) = await (s, a)
        stepsToday = Int(steps)
        activeCaloriesToday = Int(active)
    }

    // MARK: - Private

    private func setLocallyConnected(_ value: Bool) {
        isLocallyConnected = value
        UserDefaults.standard.set(value, forKey: Self.connectedKey)
    }

    private func updateAuthStatus() async {
        guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else { return }
        let status = store.authorizationStatus(for: stepType)
        switch status {
        case .notDetermined: authStatus = .notDetermined
        case .sharingDenied: authStatus = .denied
        case .sharingAuthorized: authStatus = .authorized
        @unknown default: authStatus = .notDetermined
        }
    }

    private func fetchToday(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit) async -> Double {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return 0 }
        let start = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
        return await withCheckedContinuation { cont in
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
                cont.resume(returning: result?.sumQuantity()?.doubleValue(for: unit) ?? 0)
            }
            store.execute(query)
        }
    }
}

#else

// Fallback stub when HealthKit framework is not linked (e.g. simulator without entitlement).
@MainActor
final class HealthKitService: ObservableObject {
    static let shared = HealthKitService()

    @Published var stepsToday: Int = 0
    @Published var activeCaloriesToday: Int = 0
    @Published var authStatus: HKAuthorizationStatus = .notDetermined
    @Published var isAvailable: Bool = false
    @Published private(set) var isLocallyConnected: Bool = true

    func requestAuthorization() async {}
    func refresh() async {}
    func disconnect() { isLocallyConnected = false }
    func reconnect() async { isLocallyConnected = true }
}

#endif
