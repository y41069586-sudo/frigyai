import Foundation

struct OnboardingPersistedState: Codable, Equatable {
    var currentStep: OnboardingStep
    var context: OnboardingContext
    var updatedAt: Date

    /// Legacy field kept for migration from earlier scaffold snapshots.
    var userData: OnboardingUserData?

    init(
        currentStep: OnboardingStep,
        context: OnboardingContext,
        updatedAt: Date = Date(),
        userData: OnboardingUserData? = nil
    ) {
        self.currentStep = currentStep
        self.context = context
        self.updatedAt = updatedAt
        self.userData = userData
    }
}

/// Backwards-compatible alias used by early scaffold code.
typealias OnboardingUserData = UserProfileDraft

@MainActor
protocol OnboardingPersistenceProtocol {
    func load() -> OnboardingPersistedState?
    func save(_ state: OnboardingPersistedState)
    func clear()
    func isMarkedComplete() -> Bool
    func markComplete()
}

@MainActor
struct UserDefaultsOnboardingPersistence: OnboardingPersistenceProtocol {
    private let stateKey = "onboardingPersistedState"
    private let completeKey = "onboardingComplete"

    func load() -> OnboardingPersistedState? {
        guard let data = UserDefaults.standard.data(forKey: stateKey) else { return nil }
        if let decoded = try? JSONDecoder().decode(OnboardingPersistedState.self, from: data) {
            return migrateIfNeeded(decoded)
        }
        return nil
    }

    func save(_ state: OnboardingPersistedState) {
        guard let data = try? JSONEncoder().encode(state) else { return }
        UserDefaults.standard.set(data, forKey: stateKey)
    }

    func clear() {
        UserDefaults.standard.removeObject(forKey: stateKey)
        UserDefaults.standard.removeObject(forKey: completeKey)
    }

    func isMarkedComplete() -> Bool {
        UserDefaults.standard.bool(forKey: completeKey)
    }

    func markComplete() {
        UserDefaults.standard.set(true, forKey: completeKey)
        UserDefaults.standard.removeObject(forKey: stateKey)
    }

    private func migrateIfNeeded(_ state: OnboardingPersistedState) -> OnboardingPersistedState {
        var migrated = state
        if migrated.context.userProfile == nil, let legacy = migrated.userData {
            migrated.context.userProfile = legacy
        }
        migrated.context.syncReferralFlag()
        return migrated
    }
}
