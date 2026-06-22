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
    @State private var statusMessage: String?
    @State private var lastScanned: String?
    @State private var cameraStatus = CameraStatus.checking

    enum CameraStatus { case checking, ready, denied }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()

                switch cameraStatus {
                case .checking:
                    ProgressView().tint(.white)

                case .ready:
                    CameraPreviewView(onScan: handleScan)
                        .ignoresSafeArea()
                    scanOverlay

                case .denied:
                    permissionDeniedView
                }
            }
            .navigationTitle("Barcode scannen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Abbrechen") { dismiss() }
                        .foregroundColor(.white)
                }
            }
            .task { await checkPermission() }
        }
    }

    // MARK: - Overlay

    @ViewBuilder private var scanOverlay: some View {
        VStack {
            Spacer()

            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.85), lineWidth: 2.5)
                    .frame(width: 280, height: 130)

                if isLookingUp {
                    ZStack {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.black.opacity(0.6))
                            .frame(width: 278, height: 128)
                        VStack(spacing: 8) {
                            ProgressView().tint(.white)
                            Text("Produkt wird gesucht…")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white)
                        }
                    }
                }
            }

            if let msg = statusMessage {
                Text(msg)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.black.opacity(0.65))
                    .clipShape(Capsule())
                    .padding(.top, 14)
            }

            Text("Halte den Barcode in den Rahmen")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.75))
                .padding(.top, 14)

            Spacer()
        }
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
        statusMessage = nil

        Task {
            let result = await lookupBarcode(barcode)
            isLookingUp = false
            if let result {
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
        guard let url = URL(string: "https://world.openfoodfacts.org/api/v0/product/\(barcode).json") else { return nil }
        guard let (data, _) = try? await URLSession.shared.data(from: url) else { return nil }
        guard let resp = try? JSONDecoder().decode(OFFFoodResponse.self, from: data),
              resp.status == 1,
              let product = resp.product else { return nil }

        let rawName = product.product_name?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !rawName.isEmpty else { return nil }

        return ScannedFood(
            barcode: barcode,
            name: rawName,
            calories: Int((product.nutriments?.energyKcal100g ?? 0).rounded()),
            protein:  Int((product.nutriments?.proteins100g ?? 0).rounded()),
            carbs:    Int((product.nutriments?.carbohydrates100g ?? 0).rounded()),
            fat:      Int((product.nutriments?.fat100g ?? 0).rounded())
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
            output.metadataObjectTypes = [.ean8, .ean13, .upce]

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

// MARK: - OpenFoodFacts models

private struct OFFFoodResponse: Decodable {
    let status: Int
    let product: OFFProduct?
}

private struct OFFProduct: Decodable {
    let product_name: String?
    let nutriments: OFFNutriments?
}

private struct OFFNutriments: Decodable {
    let energyKcal100g: Double?
    let proteins100g: Double?
    let carbohydrates100g: Double?
    let fat100g: Double?

    enum CodingKeys: String, CodingKey {
        case energyKcal100g      = "energy-kcal_100g"
        case proteins100g        = "proteins_100g"
        case carbohydrates100g   = "carbohydrates_100g"
        case fat100g             = "fat_100g"
    }
}
