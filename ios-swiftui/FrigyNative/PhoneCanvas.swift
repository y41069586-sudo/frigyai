import SwiftUI

/// On iPad, constrains the whole app to a fixed iPhone-sized canvas centered on
/// screen instead of stretching every layout to fill the iPad's much larger
/// display — the same "always looks like a phone" appearance apps like Cal AI
/// have. This is a deliberate SwiftUI-level fix: declaring the app iPhone-only
/// (`TARGETED_DEVICE_FAMILY "1"`) was tried first to get iOS's native
/// Compatibility Mode to do this for free, but a real iPadOS 26 build still
/// rendered full-bleed with the tab bar at the top — whatever that OS does with
/// iPhone-only apps now, it isn't the classic small letterboxed window, so this
/// is handled deterministically here instead.
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
                    // A plain .frame() constrains the RENDERED size but doesn't
                    // change the size class UIKit hands down from the real iPad
                    // window — without this, adaptive views like TabView would
                    // still detect "regular" width and keep their iPad-style
                    // top bar, just squeezed into the small box. Forcing compact/
                    // regular here is what makes descendants behave as if they're
                    // genuinely on an iPhone.
                    .environment(\.horizontalSizeClass, .compact)
                    .environment(\.verticalSizeClass, .regular)
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
