import Foundation

// MARK: - Domain-split context (mitigates uncontrolled growth)
//
// Source of truth map: see `OnboardingStateField` in OnboardingFlowTelemetry.swift
// - backend: isAuthenticated, hasAccount, isPremium (via ExternalGate)
// - localCache: completedSteps, profile.draft fields
// - derived: hasReferralCode (from profile.draft.referralCode)

struct OnboardingAuthContext: Codable, Equatable {
    var hasAccount: Bool = false
    var isAuthenticated: Bool = false
}

struct OnboardingProfileContext: Codable, Equatable {
    var draft: UserProfileDraft = .empty

    var hasReferralCode: Bool {
        !(draft.referralCode?.isEmpty ?? true)
    }
}

struct OnboardingMonetizationContext: Codable, Equatable {
    var isPremium: Bool = false
}

struct OnboardingProgressContext: Codable, Equatable {
    var completedSteps: Set<OnboardingStep> = []
}

/// Aggregated onboarding state — domain-split internally, flat accessors for callers.
struct OnboardingContext: Equatable {
    var auth = OnboardingAuthContext()
    var profile = OnboardingProfileContext()
    var monetization = OnboardingMonetizationContext()
    var progress = OnboardingProgressContext()

    static let initial = OnboardingContext()

    // MARK: - Flat accessors (backward compatible)

    var hasAccount: Bool {
        get { auth.hasAccount }
        set { auth.hasAccount = newValue }
    }

    var isAuthenticated: Bool {
        get { auth.isAuthenticated }
        set { auth.isAuthenticated = newValue }
    }

    var hasReferralCode: Bool { profile.hasReferralCode }

    var isPremium: Bool {
        get { monetization.isPremium }
        set { monetization.isPremium = newValue }
    }

    var completedSteps: Set<OnboardingStep> {
        get { progress.completedSteps }
        set { progress.completedSteps = newValue }
    }

    var userProfile: UserProfileDraft? {
        get { profile.draft }
        set { profile.draft = newValue ?? .empty }
    }

    mutating func syncReferralFlag() {
        // Referral is derived from profile.draft — no separate flag to sync.
    }
}

// MARK: - Codable (nested + legacy flat migration)

extension OnboardingContext: Codable {
    private enum CodingKeys: String, CodingKey {
        case auth, profile, monetization, progress
        case hasAccount, isAuthenticated, hasReferralCode, isPremium, completedSteps, userProfile
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        if container.contains(.auth) || container.contains(.profile) {
            auth = try container.decodeIfPresent(OnboardingAuthContext.self, forKey: .auth) ?? .init()
            profile = try container.decodeIfPresent(OnboardingProfileContext.self, forKey: .profile) ?? .init()
            monetization = try container.decodeIfPresent(OnboardingMonetizationContext.self, forKey: .monetization) ?? .init()
            progress = try container.decodeIfPresent(OnboardingProgressContext.self, forKey: .progress) ?? .init()
            return
        }

        // Legacy flat payload
        auth.hasAccount = try container.decodeIfPresent(Bool.self, forKey: .hasAccount) ?? false
        auth.isAuthenticated = try container.decodeIfPresent(Bool.self, forKey: .isAuthenticated) ?? false
        monetization.isPremium = try container.decodeIfPresent(Bool.self, forKey: .isPremium) ?? false

        if let rawSteps = try container.decodeIfPresent([String].self, forKey: .completedSteps) {
            progress.completedSteps = Set(rawSteps.compactMap(OnboardingStep.init(rawValue:)))
        }

        if let legacyProfile = try container.decodeIfPresent(UserProfileDraft.self, forKey: .userProfile) {
            profile.draft = legacyProfile
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(auth, forKey: .auth)
        try container.encode(profile, forKey: .profile)
        try container.encode(monetization, forKey: .monetization)
        try container.encode(progress, forKey: .progress)
    }
}

extension OnboardingProgressContext {
    private enum CodingKeys: String, CodingKey { case completedSteps }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let raw = try container.decode([String].self, forKey: .completedSteps)
        completedSteps = Set(raw.compactMap(OnboardingStep.init(rawValue:)))
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(completedSteps.map(\.rawValue).sorted(), forKey: .completedSteps)
    }
}
