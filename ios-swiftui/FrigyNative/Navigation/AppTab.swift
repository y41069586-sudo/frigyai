import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case home
    case plans
    case shopping

    var id: String { rawValue }

    var title: LocalizedStringKey {
        switch self {
        case .home: "Home"
        case .plans: "Plans"
        case .shopping: "Shopping"
        }
    }

    var systemImage: String {
        switch self {
        case .home: "house.fill"
        case .plans: "calendar"
        case .shopping: "cart.fill"
        }
    }
}
