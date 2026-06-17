import Foundation

// MARK: - State source of truth (derived vs backend vs local)

/// Documents where onboarding flags originate — prevents silent drift.
enum OnboardingStateSource: String, Codable {
    /// Written by `OnboardingExternalGate` / Supabase session.
    case backend
    /// Cached on device (UserDefaults / coordinator persistence).
    case localCache
    /// Computed from other fields — never persisted independently.
    case derived
}

enum OnboardingStateField: String, CaseIterable {
    case isAuthenticated
    case hasAccount
    case isPremium
    case hasReferralCode
    case completedSteps

    var source: OnboardingStateSource {
        switch self {
        case .isAuthenticated, .hasAccount, .isPremium:
            return .backend
        case .completedSteps:
            return .localCache
        case .hasReferralCode:
            return .derived
        }
    }

    var derivedFrom: String? {
        switch self {
        case .hasReferralCode:
            return "profile.draft.referralCode"
        default:
            return nil
        }
    }
}

// MARK: - Telemetry models

struct OnboardingRuleDecision: Codable, Equatable, Identifiable {
    var id: String { "\(module)-\(priority)-\(role)" }
    let module: String
    let role: OnboardingRuleRole
    let priority: Int
    let result: String
    let detail: String?
}

enum OnboardingRuleRole: String, Codable {
    case route
    case gate
    case linearFlow
    case stepGuard
}

struct OnboardingTelemetryContextSnapshot: Codable, Equatable {
    var isAuthenticated: Bool
    var isPremium: Bool
    var hasReferralCode: Bool
    var completedStepCount: Int

    init(context: OnboardingContext) {
        isAuthenticated = context.isAuthenticated
        isPremium = context.isPremium
        hasReferralCode = context.hasReferralCode
        completedStepCount = context.completedSteps.count
    }
}

struct OnboardingTransitionTrace: Codable, Equatable, Identifiable {
    let id: UUID
    let timestamp: Date
    let action: OnboardingTransitionAction
    let from: OnboardingStep
    let to: OnboardingStep?
    let flowLayer: OnboardingFlowLayer
    let allowed: Bool
    let blockReason: String?
    let proposedSource: String?
    let decisions: [OnboardingRuleDecision]
    let contextSnapshot: OnboardingTelemetryContextSnapshot
}

enum OnboardingTransitionAction: String, Codable {
    case next
    case back
    case jump
    case resume
    case deepLink
}

// MARK: - Ring buffer (TestFlight / QA — not DEBUG-only)

@MainActor
@Observable
final class OnboardingFlowTelemetry {
    static let shared = OnboardingFlowTelemetry()

    private(set) var traces: [OnboardingTransitionTrace] = []
    var capacity: Int = 50

    private init() {}

    func record(_ trace: OnboardingTransitionTrace) {
        traces.append(trace)
        if traces.count > capacity {
            traces.removeFirst(traces.count - capacity)
        }
    }

    func exportJSON(pretty: Bool = true) -> String? {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        if pretty { encoder.outputFormatting = [.prettyPrinted, .sortedKeys] }
        guard let data = try? encoder.encode(traces) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func clear() {
        traces.removeAll()
    }
}
