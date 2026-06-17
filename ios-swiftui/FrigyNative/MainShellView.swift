import SwiftUI

/// Root shell for authenticated users. Uses a custom glass tab bar instead of `TabView`
/// so selection morphing works via `glassEffectID`.
struct MainShellView: View {
    @State private var selection: AppTab = .home
    @State private var showTracker = false

    var body: some View {
        ZStack(alignment: .bottom) {
            tabContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            GlassTabBar(selection: $selection) {
                showTracker = true
            }
        }
        .sheet(isPresented: $showTracker) {
            NavigationStack {
                TrackerLogMealView()
            }
        }
    }

    @ViewBuilder
    private var tabContent: some View {
        switch selection {
        case .home:
            HomeDashboardView()
        case .plans:
            MealPlansView()
        case .shopping:
            ShoppingListView()
        }
    }
}

#if DEBUG
struct GlassPreviewShell: View {
    var body: some View {
        MainShellView()
    }
}
#endif
