import Foundation

/// Single source of truth for referral code resolution across multiple inputs.
enum ReferralSource: String, Codable, CaseIterable, Comparable {
    case backendAttribution
    case deepLink
    case campaignTracking
    case localPending
    case manualEntry

  /// Lower = higher precedence when multiple sources provide a code.
    var precedence: Int {
        switch self {
        case .backendAttribution: 0
        case .deepLink: 10
        case .campaignTracking: 20
        case .localPending: 30
        case .manualEntry: 40
        }
    }

    static func < (lhs: ReferralSource, rhs: ReferralSource) -> Bool {
        lhs.precedence < rhs.precedence
    }
}

struct ResolvedReferral: Codable, Equatable {
    let code: String
    let source: ReferralSource
}

/// Raw inputs — only the resolver writes `resolved`.
struct ReferralInputSources: Codable, Equatable {
    var deepLink: String?
    var localPending: String?
    var backendAttribution: String?
    var campaignTracking: String?
    var manualEntry: String?

    static let empty = ReferralInputSources()

    func candidate(for source: ReferralSource) -> String? {
        let raw: String? = switch source {
        case .deepLink: deepLink
        case .localPending: localPending
        case .backendAttribution: backendAttribution
        case .campaignTracking: campaignTracking
        case .manualEntry: manualEntry
        }
        guard let trimmed = raw?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmed.isEmpty else {
            return nil
        }
        return trimmed
    }

    var allCandidates: [(ReferralSource, String)] {
        ReferralSource.allCases.compactMap { source in
            candidate(for: source).map { (source, $0) }
        }
    }
}

enum ReferralCodeResolver {
    /// Picks exactly one winning code by source precedence. Ties on same source are impossible (one slot each).
    static func resolve(_ sources: ReferralInputSources) -> ResolvedReferral? {
        let ranked = sources.allCandidates.sorted { $0.0 < $1.0 }
        guard let winner = ranked.first else { return nil }
        return ResolvedReferral(code: winner.1, source: winner.0)
    }

    /// All candidates that would lose against the winner — useful for telemetry.
    static func suppressedAlternatives(_ sources: ReferralInputSources) -> [ResolvedReferral] {
        let ranked = sources.allCandidates.sorted { $0.0 < $1.0 }
        return ranked.dropFirst().map { ResolvedReferral(code: $0.1, source: $0.0) }
    }
}

struct OnboardingReferralContext: Codable, Equatable {
    var inputs = ReferralInputSources.empty
    var resolved: ResolvedReferral?

    var hasReferralCode: Bool { resolved != nil }

    var winningCode: String? { resolved?.code }

    mutating func applyResolution() {
        resolved = ReferralCodeResolver.resolve(inputs)
    }

    mutating func setInput(_ code: String?, for source: ReferralSource) {
        let normalized = code?.trimmingCharacters(in: .whitespacesAndNewlines)
        switch source {
        case .deepLink: inputs.deepLink = normalized
        case .localPending: inputs.localPending = normalized
        case .backendAttribution: inputs.backendAttribution = normalized
        case .campaignTracking: inputs.campaignTracking = normalized
        case .manualEntry: inputs.manualEntry = normalized
        }
        applyResolution()
    }
}
