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

    private let store = HKHealthStore()

    private let readTypes: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
    ]

    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            await updateAuthStatus()
            await refresh()
        } catch {
            authStatus = .denied
        }
    }

    func refresh() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        await updateAuthStatus()
        guard authStatus == .authorized else { return }
        async let s = fetchToday(.stepCount, unit: .count())
        async let a = fetchToday(.activeEnergyBurned, unit: .kilocalorie())
        let (steps, active) = await (s, a)
        stepsToday = Int(steps)
        activeCaloriesToday = Int(active)
    }

    // MARK: - Private

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

    func requestAuthorization() async {}
    func refresh() async {}
}

#endif
