import SwiftUI
import AVFoundation

// MARK: - Model

struct ScannedFood {
    let barcode: String
    var name: String
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int
}

// MARK: - View

struct BarcodeScannerView: View {
    @Environment(\.dismiss) private var dismiss
    let onResult: (ScannedFood) -> Void

    @State private var isLookingUp = false
    @State private var lookupPhase = 0
    @State private var statusMessage: String?
    @State private var lastScanned: String?
    @State private var cameraStatus = CameraStatus.checking
    @State private var scanLineOffset: CGFloat = -50

    enum CameraStatus { case checking, ready, denied }

    private let lookupPhases = [
        "🔍 Barcode erkannt",
        "🤖 KI analysiert Produkt…",
        "📊 Nährwerte werden geladen…",
    ]

    var body: some View {
        ZStack(alignment: .topLeading) {
            Color.black.ignoresSafeArea()

            switch cameraStatus {
            case .checking:
                ProgressView().tint(.white)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

            case .ready:
                CameraPreviewView(onScan: handleScan)
                    .ignoresSafeArea()
                scanOverlay

            case .denied:
                permissionDeniedView
            }

            // Close button overlay
            Button { dismiss() } label: {
                HStack(spacing: 4) {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .semibold))
                    Text("Schließen")
                        .font(.system(size: 14, weight: .medium))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Capsule().fill(Color.black.opacity(0.45)))
            }
            .buttonStyle(.plain)
            .padding(.top, 56)
            .padding(.leading, 20)
        }
        .task { await checkPermission() }
    }

    // MARK: - Overlay

    @ViewBuilder private var scanOverlay: some View {
        VStack {
            Spacer()
            // Without this frame the VStack only takes its intrinsic (content) width,
            // and the enclosing ZStack(alignment: .topLeading) then pins it to the
            // left edge instead of centering it — that's what made the scan frame
            // appear shifted off-center.

            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isLookingUp ? FrigyBrand.primary : Color.white.opacity(0.85), lineWidth: 2.5)
                    .frame(width: 280, height: 130)
                    .animation(.easeInOut(duration: 0.3), value: isLookingUp)

                if !isLookingUp {
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [FrigyBrand.primary.opacity(0), FrigyBrand.primary, FrigyBrand.primary.opacity(0)],
                                startPoint: .leading, endPoint: .trailing
                            )
                        )
                        .frame(width: 260, height: 2)
                        .clipShape(RoundedRectangle(cornerRadius: 1))
                        .offset(y: scanLineOffset)
                        .onAppear {
                            withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
                                scanLineOffset = 50
                            }
                        }
                }

                if isLookingUp {
                    ZStack {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.black.opacity(0.72))
                            .frame(width: 278, height: 128)
                        VStack(spacing: 10) {
                            ProgressView().tint(.white)
                            Text(lookupPhases[lookupPhase])
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white)
                                .animation(.easeInOut(duration: 0.25), value: lookupPhase)
                        }
                    }
                }
            }

            if let msg = statusMessage {
                VStack(spacing: 10) {
                    Text(msg)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.black.opacity(0.65))
                        .clipShape(Capsule())
                    Button("Manuell eingeben") {
                        onResult(ScannedFood(barcode: lastScanned ?? "", name: "", calories: 0,
                                             protein: 0, carbs: 0, fat: 0))
                        dismiss()
                    }
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(FrigyBrand.primary)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
                    .background(Capsule().fill(FrigyBrand.primary.opacity(0.18)))
                    .buttonStyle(.plain)
                }
                .padding(.top, 14)
            }

            Text(isLookingUp ? "" : "Halte den Barcode in den Rahmen")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.75))
                .padding(.top, 14)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder private var permissionDeniedView: some View {
        VStack(spacing: 16) {
            Image(systemName: "camera.fill.badge.ellipsis")
                .font(.system(size: 48))
                .foregroundColor(.white.opacity(0.6))
            Text("Kamera-Zugriff verweigert")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)
            Text("Aktiviere den Kamera-Zugriff in den Einstellungen.")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button("Einstellungen öffnen") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            .padding(.horizontal, 24).padding(.vertical, 10)
            .background(Color.white.opacity(0.15))
            .clipShape(Capsule())
            .foregroundColor(.white)
        }
    }

    // MARK: - Logic

    private func checkPermission() async {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            cameraStatus = .ready
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            cameraStatus = granted ? .ready : .denied
        default:
            cameraStatus = .denied
        }
    }

    private func handleScan(barcode: String) {
        guard !isLookingUp, lastScanned != barcode else { return }
        lastScanned = barcode
        isLookingUp = true
        lookupPhase = 0
        statusMessage = nil

        Task {
            // Step animation — runs concurrently with the actual lookup
            Task {
                for i in 1..<lookupPhases.count {
                    try? await Task.sleep(nanoseconds: 900_000_000)
                    guard isLookingUp else { return }
                    lookupPhase = i
                }
            }

            let result = await lookupBarcode(barcode)
            isLookingUp = false
            lookupPhase = 0

            if let result {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                onResult(result)
                dismiss()
            } else {
                statusMessage = "Produkt nicht gefunden. Manuell eingeben?"
                try? await Task.sleep(nanoseconds: 2_500_000_000)
                lastScanned = nil
                statusMessage = nil
            }
        }
    }

    private func lookupBarcode(_ barcode: String) async -> ScannedFood? {
        guard let food = await TrackerDataService.shared.analyzeFood(query: barcode) else { return nil }
        return ScannedFood(
            barcode: barcode,
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat
        )
    }
}

// MARK: - Camera preview (UIViewRepresentable)

private struct CameraPreviewView: UIViewRepresentable {
    let onScan: (String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onScan: onScan) }

    func makeUIView(context: Context) -> PreviewUIView {
        let view = PreviewUIView()
        context.coordinator.start(previewView: view)
        return view
    }

    func updateUIView(_ uiView: PreviewUIView, context: Context) {}

    static func dismantleUIView(_ uiView: PreviewUIView, coordinator: Coordinator) {
        coordinator.stop()
    }

    // MARK: Coordinator

    final class Coordinator: NSObject, AVCaptureMetadataOutputObjectsDelegate {
        let onScan: (String) -> Void
        private var session: AVCaptureSession?

        init(onScan: @escaping (String) -> Void) { self.onScan = onScan }

        func start(previewView: PreviewUIView) {
            let session = AVCaptureSession()
            guard let device = AVCaptureDevice.default(for: .video),
                  let input = try? AVCaptureDeviceInput(device: device),
                  session.canAddInput(input) else { return }
            session.addInput(input)

            let output = AVCaptureMetadataOutput()
            guard session.canAddOutput(output) else { return }
            session.addOutput(output)
            output.setMetadataObjectsDelegate(self, queue: .main)
            // EAN/UPC cover most retail food; code128 + GS1 DataMatrix appear on
            // some European packaging. Only set types the session actually supports.
            let desired: [AVMetadataObject.ObjectType] = [.ean8, .ean13, .upce, .code128, .dataMatrix]
            output.metadataObjectTypes = desired.filter { output.availableMetadataObjectTypes.contains($0) }

            let layer = AVCaptureVideoPreviewLayer(session: session)
            layer.videoGravity = .resizeAspectFill
            layer.frame = previewView.bounds
            previewView.layer.addSublayer(layer)
            previewView.previewLayer = layer
            self.session = session

            DispatchQueue.global(qos: .userInitiated).async { [weak session] in
                session?.startRunning()
            }
        }

        func stop() {
            DispatchQueue.global(qos: .background).async { [weak self] in
                self?.session?.stopRunning()
            }
        }

        func metadataOutput(_ output: AVCaptureMetadataOutput,
                            didOutput metadataObjects: [AVMetadataObject],
                            from connection: AVCaptureConnection) {
            guard let obj = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
                  let value = obj.stringValue else { return }
            onScan(value)
        }
    }

    // MARK: UIView subclass

    final class PreviewUIView: UIView {
        var previewLayer: AVCaptureVideoPreviewLayer?
        override func layoutSubviews() {
            super.layoutSubviews()
            previewLayer?.frame = bounds
        }
    }
}
