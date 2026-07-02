import SwiftUI

/// On iPad, constrains the whole app to a fixed iPhone-sized canvas centered on
/// screen instead of stretching every layout to fill the iPad's much larger
/// display — the same "always looks like a phone" approach apps like Cal AI use.
/// One single layout for every device, no separate iPad-adaptive UI (sidebars,
/// multi-column layouts, top-floating tab bars, …) to design, build and maintain.
enum FrigyPhoneCanvas {
    /// iPhone 15/16 Pro Max logical point size — a representative modern iPhone.
    static let size = CGSize(width: 430, height: 932)
}

extension View {
    /// No-op on iPhone. On iPad, clips the app to `FrigyPhoneCanvas.size`,
    /// centers it, and fills the remaining screen with a neutral dark backdrop —
    /// the app always renders as a floating phone-shaped card, never full-bleed.
    @ViewBuilder
    func phoneCanvasOnPad() -> some View {
        if UIDevice.current.userInterfaceIdiom == .pad {
            GeometryReader { geo in
                self
                    .frame(width: FrigyPhoneCanvas.size.width, height: FrigyPhoneCanvas.size.height)
                    .clipShape(RoundedRectangle(cornerRadius: 44, style: .continuous))
                    .shadow(color: .black.opacity(0.45), radius: 50, y: 24)
                    .position(x: geo.size.width / 2, y: geo.size.height / 2)
                    .frame(width: geo.size.width, height: geo.size.height)
                    .background(Color.black.ignoresSafeArea())
            }
            .ignoresSafeArea()
        } else {
            self
        }
    }
}
