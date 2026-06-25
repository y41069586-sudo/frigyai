import Foundation
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
        HKQuantityType(.stepCount),
        HKQuantityType(.activeEnergyBurned)
    ]

    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            authStatus = store.authorizationStatus(for: HKQuantityType(.stepCount))
            await refresh()
        } catch {
            // Silently ignore — user may have declined.
        }
    }

    func refresh() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        async let steps = querySum(type: .stepCount, unit: HKUnit.count())
        async let cals  = querySum(type: .activeEnergyBurned, unit: HKUnit.kilocalorie())
        let (s, c) = await (steps, cals)
        stepsToday = Int(s)
        activeCaloriesToday = Int(c)
    }

    private func querySum(type identifier: HKQuantityTypeIdentifier, unit: HKUnit) async -> Double {
        let quantityType = HKQuantityType(identifier)
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay, end: Date(), options: .strictStartDate
        )
        return await withCheckedContinuation { cont in
            let query = HKStatisticsQuery(
                quantityType: quantityType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, stats, _ in
                let value = stats?.sumQuantity()?.doubleValue(for: unit) ?? 0
                cont.resume(returning: value)
            }
            store.execute(query)
        }
    }
}
