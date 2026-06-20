import Capacitor
import SwiftUI

/// Hosts the full Frigy React app (bundled `public/`) with native Capacitor plugins.
struct CapacitorHostView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> CAPBridgeViewController {
        CAPBridgeViewController()
    }

    func updateUIViewController(_ uiViewController: CAPBridgeViewController, context: Context) {}
}
