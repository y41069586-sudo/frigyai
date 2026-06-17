import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack {
                Text("Home Dashboard")
                    .navigationTitle("Frigy")
            }
            .tabItem {
                Label("Home", systemImage: "house.fill")
            }

            NavigationStack {
                Text("Meal Plans")
                    .navigationTitle("Plans")
            }
            .tabItem {
                Label("Plans", systemImage: "calendar")
            }

            NavigationStack {
                Text("Shopping")
                    .navigationTitle("Shopping")
            }
            .tabItem {
                Label("Shopping", systemImage: "cart")
            }

            GlassDemoView()
                .tabItem {
                    Label("Glass", systemImage: "sparkles")
                }
        }
    }
}
