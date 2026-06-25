import Foundation
import SwiftUI

// HealthKit entitlements are removed from the provisioning profile.
// This stub preserves the public interface so HomeDashboardView compiles unchanged.
// Re-enable by restoring HealthKit.framework, the entitlements, and the real implementation.

// Mirrors HKAuthorizationStatus cases used in HomeDashboardView.
enum HKAuthorizationStatus: Equatable {
    case notDetermined
    case denied
    case authorized
}

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
