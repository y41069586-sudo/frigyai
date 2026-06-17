import Foundation

// MARK: - Domain-split context (mitigates uncontrolled growth)
//
// Source of truth map: see `OnboardingStateField` in OnboardingFlowTelemetry.swift
// - backend: isAuthenticated, hasAccount, isPremium (via ExternalGate)
// - localCache: completedSteps, profile.draft fields, referral.inputs
// - derived: hasReferralCode (via ReferralCodeResolver)

struct OnboardingAuthContext: Codable, Equatable {
    var hasAccount: Bool = false
    var isAuthenticated: Bool = false
}

struct OnboardingProfileContext: Codable, Equatable {
    var draft: UserProfileDraft = .empty
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
    var referral = OnboardingReferralContext()
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

    var hasReferralCode: Bool { referral.hasReferralCode }

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

    // MARK: - Referral (single resolver path)

    mutating func setReferralInput(_ code: String?, for source: ReferralSource) {
        referral.setInput(code, for: source)
        syncReferralToProfile()
    }

    mutating func syncReferralToProfile() {
        referral.applyResolution()
        profile.draft.referralCode = referral.winningCode
    }

    mutating func syncReferralFlag() {
        syncReferralToProfile()
    }
}

// MARK: - Codable (nested + legacy flat migration)

extension OnboardingContext: Codable {
    private enum CodingKeys: String, CodingKey {
        case auth, profile, referral, monetization, progress
        case hasAccount, isAuthenticated, hasReferralCode, isPremium, completedSteps, userProfile
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        if container.contains(.auth) || container.contains(.profile) {
            auth = try container.decodeIfPresent(OnboardingAuthContext.self, forKey: .auth) ?? .init()
            profile = try container.decodeIfPresent(OnboardingProfileContext.self, forKey: .profile) ?? .init()
            referral = try container.decodeIfPresent(OnboardingReferralContext.self, forKey: .referral) ?? .init()
            monetization = try container.decodeIfPresent(OnboardingMonetizationContext.self, forKey: .monetization) ?? .init()
            progress = try container.decodeIfPresent(OnboardingProgressContext.self, forKey: .progress) ?? .init()

            if referral.resolved == nil, let legacyCode = profile.draft.referralCode, !legacyCode.isEmpty {
                referral.setInput(legacyCode, for: .localPending)
            }
            syncReferralToProfile()
            return
        }

        // Legacy flat payload
        auth = OnboardingAuthContext()
        profile = OnboardingProfileContext()
        referral = OnboardingReferralContext()
        monetization = OnboardingMonetizationContext()
        progress = OnboardingProgressContext()

        auth.hasAccount = try container.decodeIfPresent(Bool.self, forKey: .hasAccount) ?? false
        auth.isAuthenticated = try container.decodeIfPresent(Bool.self, forKey: .isAuthenticated) ?? false
        monetization.isPremium = try container.decodeIfPresent(Bool.self, forKey: .isPremium) ?? false

        if let rawSteps = try container.decodeIfPresent([String].self, forKey: .completedSteps) {
            progress.completedSteps = Set(rawSteps.compactMap(OnboardingStep.init(rawValue:)))
        }

        if let legacyProfile = try container.decodeIfPresent(UserProfileDraft.self, forKey: .userProfile) {
            profile.draft = legacyProfile
            if let legacyCode = legacyProfile.referralCode, !legacyCode.isEmpty {
                referral.setInput(legacyCode, for: .localPending)
            }
        }
        syncReferralToProfile()
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(auth, forKey: .auth)
        try container.encode(profile, forKey: .profile)
        try container.encode(referral, forKey: .referral)
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
