import SwiftUI
import UserNotifications
import Charts

// MARK: - Route Views

struct HomeRouteView: View {
    let route: HomeRoute

    var body: some View {
        switch route {
        case .profile:            ProfileView()
        case .badges:             BadgesView()
        case .foodEntry(let id):  FoodEntryView(id: id)
        case .chatbot:            ChatbotView()
        case .weightProgress:     WeightProgressView()
        }
    }
}

struct PlansRouteView: View {
    let route: PlansRoute

    var body: some View {
        switch route {
        case .mealDetail(let id): MealDetailView(id: id)
        case .reminders:          RemindersView()
        case .preferences:        MealPlanPreferencesView()
        }
    }
}

struct ShoppingRouteView: View {
    let route: ShoppingRoute

    var body: some View {
        switch route {
        case .category(let name): ShoppingCategoryView(name: name)
        case .item(let id):       ShoppingItemDetailView(id: id)
        }
    }
}

// MARK: - Tab Roots

struct HomeTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .home)) {
            HomeDashboardView()
                .navigationDestination(for: HomeRoute.self) { HomeRouteView(route: $0) }
        }
        .onAppear { tabCoordinator.markTabActivated(.home) }
    }
}

struct PlansTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .plans)) {
            MealPlansView()
                .navigationDestination(for: PlansRoute.self) { PlansRouteView(route: $0) }
        }
        .onAppear { tabCoordinator.markTabActivated(.plans) }
    }
}

struct ShoppingTabRoot: View {
    @Environment(MainTabCoordinator.self) private var tabCoordinator

    var body: some View {
        NavigationStack(path: tabCoordinator.bindingPath(for: .shopping)) {
            ShoppingListView()
                .navigationDestination(for: ShoppingRoute.self) { ShoppingRouteView(route: $0) }
        }
        .onAppear { tabCoordinator.markTabActivated(.shopping) }
    }
}

// MARK: - Profile

struct ProfileView: View {
    @Environment(AppRouter.self) private var router
    @State private var userEmail: String = ""
    @State private var isRestoring = false

    private var appVersion: String {
        let v = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let b = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "0"
        return "Version \(v) (\(b))"
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Profil")

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    VStack(spacing: 10) {
                        ZStack {
                            Circle()
                                .fill(FrigyBrand.selectedBg)
                                .frame(width: 88, height: 88)
                            Image(systemName: "person.fill")
                                .font(.system(size: 40))
                                .foregroundColor(FrigyBrand.primaryDark)
                        }
                        Text(userEmail.isEmpty ? "Mein Profil" : userEmail)
                            .font(.system(size: userEmail.isEmpty ? 20 : 15, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                            .lineLimit(1)

                        HStack(spacing: 5) {
                            Image(systemName: router.isPremium ? "crown.fill" : "leaf.fill")
                                .font(.system(size: 11, weight: .bold))
                            Text(router.isPremium ? "Premium aktiv" : "Kostenloser Plan")
                                .font(.system(size: 12, weight: .bold))
                        }
                        .foregroundColor(router.isPremium ? Color(hex: "#F59E0B") : FrigyBrand.primaryDark)
                        .padding(.horizontal, 12).padding(.vertical, 5)
                        .background(Capsule().fill(router.isPremium ? Color(hex: "#FFFBEB") : FrigyBrand.selectedBg))
                        .overlay(Capsule().stroke(router.isPremium ? Color(hex: "#FCD34D") : FrigyBrand.borderMint, lineWidth: 1))
                    }
                    .padding(.top, 8)

                    VStack(spacing: 0) {
                        NavigationLink(destination: TransformationView()) {
                            profileRow("Transformation", icon: "figure.arms.open", color: Color(hex: "#8B5CF6"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: RemindersView()) {
                            profileRow("Benachrichtigungen", icon: "bell.fill", color: Color(hex: "#FBBF24"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: SubscriptionView()) {
                            profileRow("Abonnement", icon: "crown.fill", color: Color(hex: "#F59E0B"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: PrivacyView()) {
                            profileRow("Datenschutz", icon: "lock.fill", color: Color(hex: "#A78BFA"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: HelpView()) {
                            profileRow("Hilfe & Support", icon: "questionmark.circle.fill", color: FrigyBrand.textMuted)
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        Button {
                            isRestoring = true
                            Task {
                                let ok = (try? await router.subscriptionService.restorePurchases()) ?? false
                                if ok { router.isPremium = true }
                                isRestoring = false
                            }
                        } label: {
                            HStack(spacing: 14) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color(hex: "#34D399").opacity(0.15))
                                        .frame(width: 32, height: 32)
                                    if isRestoring {
                                        ProgressView().scaleEffect(0.7)
                                    } else {
                                        Image(systemName: "arrow.clockwise")
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(Color(hex: "#34D399"))
                                    }
                                }
                                Text("Käufe wiederherstellen")
                                    .font(.system(size: 15))
                                    .foregroundColor(FrigyBrand.text)
                                Spacer()
                            }
                            .padding(14)
                        }
                        .buttonStyle(.plain)
                        .disabled(isRestoring)
                    }
                    .frigyCard(cornerRadius: 16)
                    .padding(.horizontal, 20)

                    Button {
                        Task { await router.signOut() }
                    } label: {
                        Label("Abmelden", systemImage: "rectangle.portrait.and.arrow.right")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(Color(hex: "#EF4444"))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(.ultraThinMaterial)
                                    .overlay(RoundedRectangle(cornerRadius: 14)
                                        .stroke(Color(hex: "#EF4444").opacity(0.3), lineWidth: 1))
                            )
                            .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20)

                    Text(appVersion)
                        .font(.system(size: 11))
                        .foregroundColor(FrigyBrand.textMuted.opacity(0.7))
                        .padding(.top, 4)

                    Spacer().frame(height: 32)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task {
            userEmail = await TrackerDataService.shared.loadUserEmail() ?? ""
            if let premium = try? await router.subscriptionService.refreshPremiumState() {
                router.isPremium = premium
            }
        }
    }

    private func profileRow(_ label: String, icon: String, color: Color) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(color.opacity(0.15))
                    .frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(color)
            }
            Text(label)
                .font(.system(size: 15))
                .foregroundColor(FrigyBrand.text)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13))
                .foregroundColor(Color(hex: "#D1D5DB"))
        }
        .padding(14)
    }
}

// MARK: - Transformation

struct TransformationPhoto: Identifiable, Codable {
    var id: String = UUID().uuidString
    var date: String
    var note: String
    var imageData: Data?
}

struct TransformationView: View {
    @State private var photos: [TransformationPhoto] = []
    @State private var showCamera = false
    @State private var showPicker = false
    @State private var pickedImage: UIImage?
    @State private var noteText = ""
    @State private var isAnalyzing = false
    @State private var aiFeedback: String?
    @State private var showAddSheet = false

    private static let storageKey = "frigy.transformation.photos.v1"

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateStyle = .medium
        return f
    }()

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(
                title: "Transformation",
                trailingIcon: "plus",
                trailingAction: { showAddSheet = true }
            )

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    // Intro banner
                    HStack(spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 14)
                                .fill(Color(hex: "#8B5CF6").opacity(0.15))
                                .frame(width: 48, height: 48)
                            Image(systemName: "figure.arms.open")
                                .font(.system(size: 22, weight: .semibold))
                                .foregroundColor(Color(hex: "#8B5CF6"))
                        }
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Dein Körper-Fortschritt")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                            Text("Mache regelmäßig Fotos und erhalte KI-Feedback zu deinem Fortschritt.")
                                .font(.system(size: 12))
                                .foregroundColor(FrigyBrand.textMuted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(16)
                    .frigyCard(cornerRadius: 18)

                    if photos.isEmpty {
                        VStack(spacing: 14) {
                            Image(systemName: "camera.viewfinder")
                                .font(.system(size: 48))
                                .foregroundColor(FrigyBrand.cardBorder)
                            Text("Noch keine Fotos")
                                .font(.system(size: 17, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                            Text("Tippe auf + um dein erstes Transformationsfoto hinzuzufügen.")
                                .font(.system(size: 13))
                                .foregroundColor(FrigyBrand.textMuted)
                                .multilineTextAlignment(.center)
                            Button {
                                showAddSheet = true
                            } label: {
                                Label("Erstes Foto hinzufügen", systemImage: "camera.fill")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 48)
                                    .background(
                                        RoundedRectangle(cornerRadius: 14)
                                            .fill(LinearGradient(
                                                colors: [Color(hex: "#8B5CF6"), Color(hex: "#6D28D9")],
                                                startPoint: .topLeading, endPoint: .bottomTrailing
                                            ))
                                    )
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal, 32)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    } else {
                        // Compare: first vs latest
                        if photos.count >= 2 {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Vergleich: Anfang vs. Jetzt")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(FrigyBrand.text)
                                HStack(spacing: 12) {
                                    photoThumb(photos.first!, label: "Start")
                                    photoThumb(photos.last!, label: "Aktuell")
                                }
                            }
                            .padding(16)
                            .frigyCard(cornerRadius: 18)
                        }

                        // AI Feedback button
                        if photos.count >= 1 {
                            Button {
                                Task { await requestAiFeedback() }
                            } label: {
                                HStack(spacing: 10) {
                                    if isAnalyzing {
                                        ProgressView().tint(.white)
                                    } else {
                                        Image(systemName: "sparkles")
                                            .font(.system(size: 15, weight: .semibold))
                                    }
                                    Text(isAnalyzing ? "Analyse läuft…" : "KI-Feedback erhalten")
                                        .font(.system(size: 15, weight: .semibold))
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(LinearGradient(
                                            colors: [Color(hex: "#8B5CF6"), Color(hex: "#6D28D9")],
                                            startPoint: .topLeading, endPoint: .bottomTrailing
                                        ))
                                )
                            }
                            .buttonStyle(.plain)
                            .disabled(isAnalyzing)

                            if let feedback = aiFeedback {
                                VStack(alignment: .leading, spacing: 8) {
                                    Label("KI-Feedback", systemImage: "sparkles")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundColor(Color(hex: "#8B5CF6"))
                                    Text(feedback)
                                        .font(.system(size: 14))
                                        .foregroundColor(FrigyBrand.text)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .padding(14)
                                .frigyCard(cornerRadius: 16)
                            }
                        }

                        // Photo timeline
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Verlauf")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                            ForEach(photos.reversed()) { photo in
                                HStack(spacing: 12) {
                                    if let data = photo.imageData, let img = UIImage(data: data) {
                                        Image(uiImage: img)
                                            .resizable().scaledToFill()
                                            .frame(width: 60, height: 60)
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                    } else {
                                        RoundedRectangle(cornerRadius: 10)
                                            .fill(FrigyBrand.cardBorder)
                                            .frame(width: 60, height: 60)
                                            .overlay(Image(systemName: "photo").foregroundColor(FrigyBrand.textMuted))
                                    }
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(photo.date)
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(FrigyBrand.text)
                                        if !photo.note.isEmpty {
                                            Text(photo.note)
                                                .font(.system(size: 12))
                                                .foregroundColor(FrigyBrand.textMuted)
                                                .lineLimit(2)
                                        }
                                    }
                                    Spacer()
                                }
                                .padding(12)
                                .frigyCard(cornerRadius: 14)
                            }
                        }
                    }

                    Spacer().frame(height: 32)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showAddSheet) {
            AddTransformationPhotoSheet { image, note in
                let photo = TransformationPhoto(
                    date: Self.dateFormatter.string(from: Date()),
                    note: note,
                    imageData: image?.jpegData(compressionQuality: 0.6)
                )
                photos.append(photo)
                save()
            }
        }
        .onAppear { load() }
    }

    private func photoThumb(_ photo: TransformationPhoto, label: String) -> some View {
        VStack(spacing: 6) {
            if let data = photo.imageData, let img = UIImage(data: data) {
                Image(uiImage: img)
                    .resizable().scaledToFill()
                    .frame(maxWidth: .infinity)
                    .frame(height: 140)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            } else {
                RoundedRectangle(cornerRadius: 14)
                    .fill(FrigyBrand.cardBorder)
                    .frame(maxWidth: .infinity, minHeight: 140)
                    .overlay(Image(systemName: "photo").foregroundColor(FrigyBrand.textMuted).font(.system(size: 30)))
            }
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(FrigyBrand.textMuted)
            Text(photo.date)
                .font(.system(size: 11))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .frame(maxWidth: .infinity)
    }

    private func requestAiFeedback() async {
        isAnalyzing = true
        aiFeedback = nil
        let count = photos.count
        let daysSince = photos.count >= 2
            ? "mehrere Wochen"
            : "kurze Zeit"
        let prompt = "Ein Nutzer macht seit \(daysSince) Transformationsfotos und hat insgesamt \(count) Foto(s) hochgeladen. Gib motivierendes, konkretes Feedback über Konsistenz und was als nächstes zu tun ist für den Körperfortschritt. Max 3 Sätze."
        let reply = await TrackerDataService.shared.sendChatMessage(prompt, history: [])
        aiFeedback = reply ?? "Tolle Arbeit, dass du deinen Fortschritt dokumentierst! Bleib konsequent und mache alle 2 Wochen ein neues Foto, um deinen Fortschritt sichtbar zu machen."
        isAnalyzing = false
    }

    private func save() {
        if let data = try? JSONEncoder().encode(photos) {
            UserDefaults.standard.set(data, forKey: Self.storageKey)
        }
    }

    private func load() {
        if let data = UserDefaults.standard.data(forKey: Self.storageKey),
           let saved = try? JSONDecoder().decode([TransformationPhoto].self, from: data) {
            photos = saved
        }
    }
}

struct AddTransformationPhotoSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onSave: (UIImage?, String) -> Void

    @State private var selectedImage: UIImage?
    @State private var noteText = ""
    @State private var showImagePicker = false
    @State private var showCamera = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button("Abbrechen") { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDark)
                Spacer()
                Text("Foto hinzufügen")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Button("Speichern") {
                    onSave(selectedImage, noteText)
                    dismiss()
                }
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(Color(hex: "#8B5CF6"))
                .disabled(selectedImage == nil)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            ScrollView {
                VStack(spacing: 20) {
                    // Image area
                    if let img = selectedImage {
                        Image(uiImage: img)
                            .resizable().scaledToFit()
                            .frame(maxWidth: .infinity)
                            .frame(maxHeight: 300)
                            .clipShape(RoundedRectangle(cornerRadius: 18))
                            .padding(.horizontal, 20)
                    } else {
                        RoundedRectangle(cornerRadius: 18)
                            .fill(FrigyBrand.cardBorder.opacity(0.3))
                            .frame(height: 200)
                            .overlay(
                                VStack(spacing: 10) {
                                    Image(systemName: "camera.fill")
                                        .font(.system(size: 36))
                                        .foregroundColor(FrigyBrand.textMuted)
                                    Text("Foto auswählen")
                                        .font(.system(size: 14))
                                        .foregroundColor(FrigyBrand.textMuted)
                                }
                            )
                            .padding(.horizontal, 20)
                    }

                    HStack(spacing: 12) {
                        Button {
                            showCamera = true
                        } label: {
                            Label("Kamera", systemImage: "camera.fill")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                                .background(RoundedRectangle(cornerRadius: 12)
                                    .fill(Color(hex: "#8B5CF6")))
                        }
                        .buttonStyle(.plain)

                        Button {
                            showImagePicker = true
                        } label: {
                            Label("Galerie", systemImage: "photo.on.rectangle")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(Color(hex: "#8B5CF6"))
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                                .background(RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color(hex: "#8B5CF6"), lineWidth: 1.5))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 20)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notiz (optional)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(FrigyBrand.textMuted)
                        TextField("z.B. Nach 4 Wochen Training", text: $noteText)
                            .padding(12)
                            .background(RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                                .overlay(RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.white.opacity(0.25), lineWidth: 1)))
                    }
                    .padding(.horizontal, 20)

                    Spacer().frame(height: 32)
                }
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .sheet(isPresented: $showImagePicker) {
            ImagePickerView(image: $selectedImage, sourceType: .photoLibrary)
        }
        .sheet(isPresented: $showCamera) {
            ImagePickerView(image: $selectedImage, sourceType: .camera)
        }
    }
}

struct ImagePickerView: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    var sourceType: UIImagePickerController.SourceType

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePickerView
        init(_ parent: ImagePickerView) { self.parent = parent }

        func imagePickerController(_ picker: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            parent.image = info[.originalImage] as? UIImage
            picker.dismiss(animated: true)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}

// MARK: - Nutrition Goals

struct NutritionGoalsView: View {
    @State private var targets = MacroTargets.default
    @State private var isSaving = false
    @State private var saved = false

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Ernährungsziele")

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    Text("Passe deine täglichen Makroziele an.")
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                        .padding(.top, 4)

                    VStack(spacing: 0) {
                        goalRow("Kalorien", value: $targets.calories, range: 1000...4000, step: 50, unit: "kcal", color: FrigyBrand.primaryDark)
                        Divider().padding(.leading, 16)
                        goalRow("Protein", value: $targets.protein, range: 30...300, step: 5, unit: "g", color: Color(hex: "#60A5FA"))
                        Divider().padding(.leading, 16)
                        goalRow("Kohlenhydrate", value: $targets.carbs, range: 50...600, step: 10, unit: "g", color: Color(hex: "#FBBF24"))
                        Divider().padding(.leading, 16)
                        goalRow("Fett", value: $targets.fat, range: 20...200, step: 5, unit: "g", color: Color(hex: "#F87171"))
                    }
                    .frigyCard(cornerRadius: 16)
                    .padding(.horizontal, 20)

                    Button {
                        Task { await save() }
                    } label: {
                        HStack {
                            Spacer()
                            if isSaving {
                                ProgressView().tint(.white)
                            } else if saved {
                                Label("Gespeichert", systemImage: "checkmark.circle.fill")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                            } else {
                                Text("Ziele speichern")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                            }
                            Spacer()
                        }
                        .frame(height: 54)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(LinearGradient(
                                    colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                ))
                                .overlay(RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                        )
                        .shadow(color: FrigyBrand.primaryDeep.opacity(0.28), radius: 12, y: 6)
                    }
                    .buttonStyle(.plain)
                    .disabled(isSaving)
                    .padding(.horizontal, 20)

                    Spacer().frame(height: 32)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await load() }
    }

    private func goalRow(_ label: String, value: Binding<Int>, range: ClosedRange<Double>, step: Double, unit: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Text("\(value.wrappedValue) \(unit)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(color)
            }
            Slider(
                value: Binding(get: { Double(value.wrappedValue) }, set: { value.wrappedValue = Int($0) }),
                in: range, step: step
            )
            .tint(color)
        }
        .padding(16)
    }

    private func load() async {
        let (_, t) = await TrackerDataService.shared.loadToday()
        targets = t
    }

    private func save() async {
        isSaving = true
        saved = false
        let ok = await TrackerDataService.shared.saveTargets(targets)
        isSaving = false
        if ok { saved = true }
    }
}

// MARK: - Subscription

struct SubscriptionView: View {
    @Environment(AppRouter.self) private var router
    @State private var showPaywall = false

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Abonnement")

            ScrollView(showsIndicators: false) {
                VStack(spacing: 24) {
                    ZStack {
                        Circle()
                            .fill(Color(hex: "#FEF3C7"))
                            .frame(width: 80, height: 80)
                        Image(systemName: "crown.fill")
                            .font(.system(size: 36))
                            .foregroundColor(Color(hex: "#F59E0B"))
                    }
                    .padding(.top, 24)

                    VStack(spacing: 8) {
                        Text(router.isPremium ? "Frigy Premium" : "Frigy Free")
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundColor(FrigyBrand.text)
                        Text(router.isPremium
                             ? "Du hast Zugriff auf alle Premium-Features."
                             : "Upgrade auf Premium für alle Features.")
                            .font(.system(size: 14))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }

                    if !router.isPremium {
                        VStack(spacing: 10) {
                            featureRow("Unbegrenzte KI-Mahlzeitenpläne", icon: "sparkles")
                            featureRow("KI-Coach ohne Limits", icon: "brain.head.profile")
                            featureRow("Barcode & Foto-Scan", icon: "camera.fill")
                            featureRow("Erweiterte Fortschrittsdiagramme", icon: "chart.line.uptrend.xyaxis")
                        }
                        .padding(.horizontal, 20)

                        Button { showPaywall = true } label: {
                            Text("Jetzt upgraden – 4,99 € / Monat")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 54)
                                .background(
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(LinearGradient(
                                            colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                            startPoint: .topLeading, endPoint: .bottomTrailing
                                        ))
                                        .overlay(RoundedRectangle(cornerRadius: 16)
                                            .stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                                )
                                .shadow(color: FrigyBrand.primaryDeep.opacity(0.28), radius: 12, y: 6)
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20)
                    }

                    Spacer().frame(height: 32)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showPaywall) {
            PaywallStepView(onNext: { showPaywall = false })
        }
    }

    private func featureRow(_ text: String, icon: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(FrigyBrand.primaryDark)
                .frame(width: 28)
            Text(text)
                .font(.system(size: 14))
                .foregroundColor(Color(hex: "#374151"))
            Spacer()
        }
        .padding(14)
        .frigyCard(cornerRadius: 12)
    }
}

// MARK: - Privacy

struct PrivacyView: View {
    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Datenschutz")

            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    privacySection("Datenerhebung", text: "Frigy speichert nur die Daten, die du aktiv eingibst: Mahlzeiten, Gewicht und Einstellungen. Alle Daten werden sicher in unserer Datenbank gespeichert.")
                    privacySection("Datenweitergabe", text: "Deine persönlichen Daten werden niemals an Dritte verkauft oder ohne deine Zustimmung weitergegeben.")
                    privacySection("Datenlöschung", text: "Du kannst jederzeit die Löschung deiner Daten beantragen, indem du uns unter support@frigy.app kontaktierst.")
                    privacySection("KI-Verarbeitung", text: "Anfragen an den KI-Coach werden verschlüsselt übertragen und nicht zur Modellverbesserung genutzt.")
                    Spacer().frame(height: 32)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }

    private func privacySection(_ title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(FrigyBrand.text)
            Text(text)
                .font(.system(size: 14))
                .foregroundColor(FrigyBrand.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frigyCard(cornerRadius: 14)
    }
}

// MARK: - Help

struct HelpView: View {
    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Hilfe & Support")

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    VStack(spacing: 0) {
                        contactRow("support@frigy.app", icon: "envelope.fill")
                        Divider().padding(.leading, 52)
                        contactRow("app.frigy.app", icon: "globe")
                    }
                    .frigyCard(cornerRadius: 16)

                    VStack(alignment: .leading, spacing: 0) {
                        Text("HÄUFIGE FRAGEN")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted)
                            .padding(.horizontal, 16)
                            .padding(.bottom, 10)

                        VStack(spacing: 0) {
                            helpRow("Wie tracke ich Mahlzeiten?",
                                    answer: "Tippe im Home-Tab auf + oder wähle eine Mahlzeitkategorie, um Lebensmittel zu suchen und zu tracken.")
                            Divider().padding(.leading, 16)
                            helpRow("Wie ändere ich meine Kalorienziele?",
                                    answer: "Gehe zu Profil → Ernährungsziele und passe die Werte mit den Schiebereglern an.")
                            Divider().padding(.leading, 16)
                            helpRow("Kann ich Gewicht tracken?",
                                    answer: "Ja! Im Home-Tab auf 'Gewicht' tippen, dann auf + um ein neues Gewicht einzutragen.")
                        }
                        .frigyCard(cornerRadius: 16)
                    }

                    Spacer().frame(height: 32)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }

    private func contactRow(_ label: String, icon: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(FrigyBrand.primary.opacity(0.15))
                    .frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(FrigyBrand.primaryDark)
            }
            Text(label)
                .font(.system(size: 15))
                .foregroundColor(FrigyBrand.text)
            Spacer()
        }
        .padding(14)
    }

    private func helpRow(_ question: String, answer: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(question)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(FrigyBrand.text)
            Text(answer)
                .font(.system(size: 13))
                .foregroundColor(FrigyBrand.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Weight Progress

struct WeightProgressView: View {
    @State private var entries: [(date: String, kg: Double)] = []
    @State private var isLoading = true
    @State private var showAddWeight = false
    @State private var newWeightText = ""

    private var minKg: Double { (entries.map(\.kg).min() ?? 80) - 0.5 }
    private var maxKg: Double { (entries.map(\.kg).max() ?? 90) + 0.5 }

    private static let labelFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "d.M."
        return f
    }()

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(
                title: "Gewichtsverlauf",
                trailingIcon: "plus",
                trailingAction: {
                    newWeightText = ""
                    showAddWeight = true
                }
            )

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    if !isLoading && entries.isEmpty {
                        VStack(spacing: 10) {
                            Image(systemName: "scalemass")
                                .font(.system(size: 40))
                                .foregroundColor(FrigyBrand.cardBorder)
                            Text("Noch keine Gewichtseinträge")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(FrigyBrand.text)
                            Text("Tippe auf +, um dein erstes Gewicht einzutragen.")
                                .font(.system(size: 13))
                                .foregroundColor(FrigyBrand.textMuted)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                        .padding(.horizontal, 30)
                    }

                    if !entries.isEmpty {
                        HStack(spacing: 12) {
                            statCard("Aktuell", value: String(format: "%.1f kg", entries.last?.kg ?? 0), icon: "scalemass.fill")
                            statCard("Start", value: String(format: "%.1f kg", entries.first?.kg ?? 0), icon: "flag.fill")
                            let diff = (entries.first?.kg ?? 0) - (entries.last?.kg ?? 0)
                            statCard(diff >= 0 ? "Verlust" : "Zuwachs",
                                     value: String(format: "%.1f kg", abs(diff)),
                                     icon: diff >= 0 ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                        }
                        .padding(.horizontal, 20)

                        VStack(alignment: .leading, spacing: 12) {
                            Text("Verlauf")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                                .padding(.horizontal, 20)

                            weightLineChart
                                .frame(height: 200)
                                .padding(.horizontal, 16)
                        }
                        .padding(.vertical, 16)
                        .frigyCard(cornerRadius: 18)
                        .padding(.horizontal, 20)
                    }

                    Spacer().frame(height: 32)
                }
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showAddWeight) {
            AddWeightSheet(onSave: { kg in
                Task {
                    await TrackerDataService.shared.addWeightEntry(kg: kg)
                    await load()
                }
            })
        }
        .task { await load() }
    }

    // Smooth, gradient-filled line chart (Swift Charts, Catmull-Rom interpolation).
    @ViewBuilder private var weightLineChart: some View {
        Chart(Array(entries.enumerated()), id: \.offset) { index, e in
            AreaMark(
                x: .value("Tag", index),
                yStart: .value("min", minKg),
                yEnd: .value("Gewicht", e.kg)
            )
            .interpolationMethod(.catmullRom)
            .foregroundStyle(
                LinearGradient(colors: [FrigyBrand.primary.opacity(0.35), FrigyBrand.primary.opacity(0.02)],
                               startPoint: .top, endPoint: .bottom)
            )

            LineMark(
                x: .value("Tag", index),
                y: .value("Gewicht", e.kg)
            )
            .interpolationMethod(.catmullRom)
            .lineStyle(StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
            .foregroundStyle(
                LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                               startPoint: .leading, endPoint: .trailing)
            )

            PointMark(
                x: .value("Tag", index),
                y: .value("Gewicht", e.kg)
            )
            .symbolSize(60)
            .foregroundStyle(FrigyBrand.primaryDark)
        }
        .chartYScale(domain: minKg...maxKg)
        .chartXAxis {
            AxisMarks(values: Array(entries.indices)) { value in
                if let i = value.as(Int.self), i < entries.count {
                    AxisValueLabel {
                        Text(entries[i].date)
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                }
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisGridLine().foregroundStyle(FrigyBrand.cardBorder.opacity(0.4))
                AxisValueLabel {
                    if let kg = value.as(Double.self) {
                        Text(String(format: "%.0f", kg))
                            .font(.system(size: 10))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                }
            }
        }
    }

    private func load() async {
        let points = await TrackerDataService.shared.loadWeightEntries()
        entries = points.map { (Self.labelFormatter.string(from: $0.date), $0.kg) }
        isLoading = false
    }

    private func statCard(_ label: String, value: String, icon: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(FrigyBrand.primaryDark)
            Text(value)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(FrigyBrand.text)
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .frigyCard(cornerRadius: 14)
    }
}

// MARK: - Add Weight Sheet

struct AddWeightSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onSave: (Double) -> Void

    @State private var text = ""
    @FocusState private var focused: Bool
    @State private var isSaving = false

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                Button("Abbrechen") { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDark)
                    .frame(width: 80, alignment: .leading)
                Spacer()
                Text("Gewicht")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Color.clear.frame(width: 80, height: 1)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            Spacer()

            VStack(spacing: 8) {
                Image(systemName: "scalemass.fill")
                    .font(.system(size: 40))
                    .foregroundColor(FrigyBrand.primaryDark)
                Text("Gewicht eintragen")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
            }

            HStack(spacing: 8) {
                TextField("z.B. 74,5", text: $text)
                    .keyboardType(.decimalPad)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .multilineTextAlignment(.center)
                    .foregroundColor(FrigyBrand.text)
                    .focused($focused)
                Text("kg")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(FrigyBrand.textMuted)
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .overlay(RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            focused ? FrigyBrand.primary.opacity(0.6) : Color.white.opacity(0.25),
                            lineWidth: 1
                        ))
            )
            .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
            .padding(.horizontal, 40)
            .padding(.top, 28)

            Button {
                let normalized = text.replacingOccurrences(of: ",", with: ".")
                guard let kg = Double(normalized), kg > 0 else { return }
                isSaving = true
                onSave(kg)
                dismiss()
            } label: {
                Text(isSaving ? "Wird gespeichert…" : "Speichern")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(LinearGradient(
                                colors: text.isEmpty
                                    ? [FrigyBrand.cardBorder, FrigyBrand.cardBorder]
                                    : [FrigyBrand.primary, FrigyBrand.primaryDark],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ))
                            .overlay(RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.white.opacity(text.isEmpty ? 0 : 0.35), lineWidth: 1).blendMode(.overlay))
                    )
                    .shadow(color: text.isEmpty ? .clear : FrigyBrand.primaryDeep.opacity(0.28), radius: 12, y: 6)
            }
            .disabled(text.isEmpty || isSaving)
            .buttonStyle(.plain)
            .padding(.horizontal, 24)
            .padding(.top, 24)

            Spacer()
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .onAppear { focused = true }
    }
}

// MARK: - Chatbot

struct ChatbotView: View {
    @State private var messages: [(role: String, text: String)] = [
        ("assistant", "Hallo! Ich bin dein KI-Ernährungscoach. Wie kann ich dir heute helfen?"),
    ]
    @State private var inputText = ""
    @FocusState private var inputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "KI-Ernährungscoach")

            ScrollViewReader { proxy in
                ScrollView(showsIndicators: false) {
                    LazyVStack(spacing: 12) {
                        ForEach(messages.indices, id: \.self) { i in
                            ChatBubble(text: messages[i].text, isUser: messages[i].role == "user")
                                .id(i)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .onChange(of: messages.count) { _, _ in
                    withAnimation { proxy.scrollTo(messages.count - 1) }
                }
            }

            HStack(spacing: 10) {
                TextField("Frag mich etwas...", text: $inputText, axis: .vertical)
                    .lineLimit(1...4)
                    .font(.system(size: 15))
                    .padding(10)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(.ultraThinMaterial)
                            .overlay(RoundedRectangle(cornerRadius: 14)
                                .stroke(
                                    inputFocused ? FrigyBrand.primary.opacity(0.5) : Color.white.opacity(0.2),
                                    lineWidth: 1
                                ))
                    )
                    .shadow(color: .black.opacity(0.04), radius: 3, y: 1)
                    .focused($inputFocused)

                Button { sendMessage() } label: {
                    ZStack {
                        Circle()
                            .fill(inputText.isEmpty
                                  ? AnyShapeStyle(FrigyBrand.cardBorder.opacity(0.4))
                                  : AnyShapeStyle(LinearGradient(
                                      colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                      startPoint: .topLeading, endPoint: .bottomTrailing
                                  )))
                            .overlay(Circle().stroke(Color.white.opacity(inputText.isEmpty ? 0 : 0.35), lineWidth: 1).blendMode(.overlay))
                            .frame(width: 36, height: 36)
                        Image(systemName: "arrow.up")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(inputText.isEmpty ? FrigyBrand.textMuted : .white)
                    }
                    .shadow(color: inputText.isEmpty ? .clear : FrigyBrand.primaryDeep.opacity(0.25), radius: 6, y: 3)
                }
                .buttonStyle(.plain)
                .disabled(inputText.isEmpty)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial)
            .overlay(Divider(), alignment: .top)
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        messages.append(("user", text))
        inputText = ""

        let history = messages.map { ChatTurn(role: $0.role, content: $0.text) }
        Task {
            let reply = await TrackerDataService.shared.sendChatMessage(text, history: history)
            messages.append((
                "assistant",
                reply ?? "Ich konnte gerade keine Antwort laden. Bitte prüfe deine Verbindung und versuche es erneut."
            ))
        }
    }
}

struct ChatBubble: View {
    let text: String
    let isUser: Bool

    var body: some View {
        HStack {
            if isUser { Spacer() }
            Text(text)
                .font(.system(size: 15))
                .foregroundColor(isUser ? .white : FrigyBrand.text)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    Group {
                        if isUser {
                            AnyView(
                                RoundedRectangle(cornerRadius: 18)
                                    .fill(LinearGradient(
                                        colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                        startPoint: .topLeading, endPoint: .bottomTrailing
                                    ))
                                    .overlay(RoundedRectangle(cornerRadius: 18)
                                        .stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                            )
                        } else {
                            AnyView(
                                RoundedRectangle(cornerRadius: 18)
                                    .fill(.ultraThinMaterial)
                                    .overlay(RoundedRectangle(cornerRadius: 18)
                                        .stroke(Color.white.opacity(0.25), lineWidth: 1))
                            )
                        }
                    }
                )
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
                .containerRelativeFrame(.horizontal) { width, _ in width * 0.75 }
            if !isUser { Spacer() }
        }
    }
}

// MARK: - Badges

struct BadgeCatalogItem: Identifiable {
    let id: String
    let icon: String
    let name: String
    let desc: String
}

struct BadgesView: View {
    private let catalog: [BadgeCatalogItem] = [
        .init(id: "streak_3",  icon: "flame.fill",          name: "3-Tage-Serie",     desc: "3 Tage in Folge aktiv"),
        .init(id: "streak_7",  icon: "bolt.fill",           name: "7-Tage-Serie",     desc: "Eine ganze Woche!"),
        .init(id: "streak_14", icon: "flame.circle.fill",   name: "14-Tage-Serie",    desc: "Zwei starke Wochen"),
        .init(id: "streak_30", icon: "trophy.fill",         name: "30-Tage-Serie",    desc: "Ein ganzer Monat!"),
        .init(id: "water_goal", icon: "drop.fill",          name: "Wasserziel",       desc: "Tagesziel Wasser erreicht"),
        .init(id: "water_week", icon: "drop.circle.fill",   name: "Hydration-Held",   desc: "7 Tage Wasserziel"),
        .init(id: "first_scan", icon: "camera.fill",        name: "Erster Scan",      desc: "Erste Mahlzeit gescannt"),
        .init(id: "meal_logged", icon: "fork.knife",        name: "Erste Mahlzeit",   desc: "Erste Mahlzeit getrackt"),
        .init(id: "weight_tracked", icon: "scalemass.fill", name: "Gewicht getrackt", desc: "Erstes Gewicht erfasst"),
        .init(id: "calorie_goal_3", icon: "target",         name: "3 Tage im Ziel",  desc: "3 Tage im Kalorienbudget"),
        .init(id: "calorie_goal_7", icon: "diamond.fill",   name: "7 Tage im Ziel",  desc: "7 Tage im Kalorienbudget"),
        .init(id: "protein_champion", icon: "bolt.heart.fill", name: "Protein-Champion", desc: "5× Proteinziel erreicht"),
        .init(id: "scanner_pro", icon: "iphone",            name: "Scanner-Profi",    desc: "20 Mahlzeiten gescannt"),
        .init(id: "weight_loss_1", icon: "arrow.down.circle.fill", name: "Erstes Kilo", desc: "1 kg abgenommen"),
        .init(id: "weight_loss_5", icon: "medal.fill",      name: "Fünf Kilo",        desc: "5 kg abgenommen"),
        .init(id: "calorie_week_perfect", icon: "sparkles", name: "Perfekte Woche",   desc: "7 Tage in Folge im Budget"),
        .init(id: "comeback",   icon: "arrow.clockwise",    name: "Comeback",         desc: "Nach Pause zurück"),
    ]

    @State private var unlockedTypes: Set<String> = []

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Abzeichen")

            ScrollView(showsIndicators: false) {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                    ForEach(catalog) { badge in
                        let unlocked = unlockedTypes.contains(badge.id)
                        VStack(spacing: 10) {
                            ZStack {
                                Circle()
                                    .fill(unlocked ? FrigyBrand.selectedBg : Color(hex: "#F3F4F6"))
                                    .frame(width: 60, height: 60)
                                Image(systemName: badge.icon)
                                    .font(.system(size: 26, weight: .semibold))
                                    .foregroundColor(unlocked ? FrigyBrand.primaryDark : Color(hex: "#D1D5DB"))
                            }
                            Text(badge.name)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(unlocked ? FrigyBrand.text : FrigyBrand.textMuted)
                            Text(badge.desc)
                                .font(.system(size: 11))
                                .foregroundColor(FrigyBrand.textMuted)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(16)
                        .frigyCard(cornerRadius: 16)
                        .opacity(unlocked ? 1 : 0.5)
                    }
                }
                .padding(20)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await load() }
    }

    private func load() async {
        let earned = await TrackerDataService.shared.loadBadges()
        unlockedTypes = Set(earned.map(\.type))
    }
}

// MARK: - Food Entry

struct FoodEntryView: View {
    let id: UUID

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Eintrag")
            Spacer()
            Text("Lebensmitteleintrag \(id.uuidString.prefix(8))")
                .foregroundColor(FrigyBrand.textMuted)
            Spacer()
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }
}

// MARK: - Meal Detail

struct MealDetailView: View {
    let id: String

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Mahlzeit")

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    Text(id)
                        .font(.title2.bold())
                        .foregroundColor(FrigyBrand.text)
                    Text("Rezeptdetails werden hier angezeigt.")
                        .foregroundColor(FrigyBrand.textMuted)
                }
                .padding(20)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }
}

// MARK: - Reminders

struct ReminderItem: Identifiable, Codable, Equatable {
    var id: String
    var hour: Int
    var minute: Int
    var label: String
    var enabled: Bool

    var timeString: String { String(format: "%02d:%02d", hour, minute) }
}

private let remindersKey = "frigy.reminders.v1"

struct RemindersView: View {
    @State private var reminders: [ReminderItem] = Self.defaultReminders()
    @State private var hasPermission = false
    @State private var showPermissionBanner = false

    private static func defaultReminders() -> [ReminderItem] {
        if let data = UserDefaults.standard.data(forKey: remindersKey),
           let saved = try? JSONDecoder().decode([ReminderItem].self, from: data) {
            return saved
        }
        return [
            ReminderItem(id: "frigy.breakfast", hour: 8,  minute: 0,  label: "Frühstück tracken",   enabled: true),
            ReminderItem(id: "frigy.lunch",     hour: 12, minute: 30, label: "Mittagessen tracken", enabled: true),
            ReminderItem(id: "frigy.dinner",    hour: 19, minute: 0,  label: "Abendessen tracken",  enabled: false),
        ]
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Erinnerungen")

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    if showPermissionBanner {
                        VStack(alignment: .leading, spacing: 10) {
                            Label("Benachrichtigungen nicht aktiv", systemImage: "bell.slash.fill")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(Color(hex: "#F59E0B"))
                            Text("Aktiviere Benachrichtigungen, um Mahlzeiterinnerungen zu erhalten.")
                                .font(.system(size: 13))
                                .foregroundColor(FrigyBrand.textMuted)
                            Button {
                                Task { await requestPermission() }
                            } label: {
                                Text("Jetzt aktivieren")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(
                                        RoundedRectangle(cornerRadius: 10)
                                            .fill(LinearGradient(
                                                colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                                startPoint: .topLeading, endPoint: .bottomTrailing
                                            ))
                                            .overlay(RoundedRectangle(cornerRadius: 10)
                                                .stroke(Color.white.opacity(0.35), lineWidth: 1).blendMode(.overlay))
                                    )
                                    .shadow(color: FrigyBrand.primaryDeep.opacity(0.25), radius: 8, y: 4)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(16)
                        .frigyCard(cornerRadius: 16)
                    }

                    VStack(spacing: 0) {
                        ForEach($reminders) { $reminder in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(reminder.timeString)
                                        .font(.system(size: 18, weight: .bold, design: .monospaced))
                                        .foregroundColor(FrigyBrand.text)
                                    Text(reminder.label)
                                        .font(.system(size: 13))
                                        .foregroundColor(FrigyBrand.textMuted)
                                }
                                Spacer()
                                Toggle("", isOn: $reminder.enabled)
                                    .tint(FrigyBrand.primaryDark)
                                    .onChange(of: reminder.enabled) { _, _ in
                                        scheduleOrCancel(reminder)
                                        save()
                                    }
                            }
                            .padding(14)
                            if reminder.id != reminders.last?.id {
                                Divider().padding(.leading, 14)
                            }
                        }
                    }
                    .frigyCard(cornerRadius: 16)

                    Spacer().frame(height: 32)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await checkPermission() }
    }

    private func save() {
        if let data = try? JSONEncoder().encode(reminders) {
            UserDefaults.standard.set(data, forKey: remindersKey)
        }
    }

    private func scheduleOrCancel(_ item: ReminderItem) {
        let center = UNUserNotificationCenter.current()
        if item.enabled {
            let content = UNMutableNotificationContent()
            content.title = "Frigy"
            content.body = item.label
            content.sound = .default
            var comps = DateComponents()
            comps.hour = item.hour
            comps.minute = item.minute
            let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
            let request = UNNotificationRequest(identifier: item.id, content: content, trigger: trigger)
            center.add(request)
        } else {
            center.removePendingNotificationRequests(withIdentifiers: [item.id])
        }
    }

    private func checkPermission() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        hasPermission = settings.authorizationStatus == .authorized
        showPermissionBanner = settings.authorizationStatus == .notDetermined || settings.authorizationStatus == .denied
    }

    private func requestPermission() async {
        let granted = (try? await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        hasPermission = granted
        showPermissionBanner = !granted
    }
}

// MARK: - Meal Plan Preferences

struct MealPlanPreferencesView: View {
    @State private var calories = 1900.0
    @State private var mealsPerDay = 3

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Plan-Einstellungen")

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("TÄGLICHE KALORIEN")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted)
                        HStack {
                            Text("\(Int(calories)) kcal")
                                .font(.system(size: 22, weight: .bold))
                                .foregroundColor(FrigyBrand.primaryDark)
                            Spacer()
                        }
                        Slider(value: $calories, in: 1200...3500, step: 50)
                            .tint(FrigyBrand.primaryDark)
                        HStack {
                            Text("1200 kcal").font(.system(size: 11)).foregroundColor(FrigyBrand.textMuted)
                            Spacer()
                            Text("3500 kcal").font(.system(size: 11)).foregroundColor(FrigyBrand.textMuted)
                        }
                    }
                    .padding(16)
                    .frigyCard(cornerRadius: 16)

                    VStack(alignment: .leading, spacing: 12) {
                        Text("MAHLZEITEN PRO TAG")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted)
                        HStack {
                            Button {
                                if mealsPerDay > 2 { mealsPerDay -= 1 }
                            } label: {
                                Image(systemName: "minus")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(mealsPerDay > 2 ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
                                    .frame(width: 40, height: 40)
                                    .background(Circle().fill(FrigyBrand.primary.opacity(mealsPerDay > 2 ? 0.15 : 0.05)))
                            }
                            .buttonStyle(.plain)

                            Spacer()
                            Text("\(mealsPerDay) Mahlzeiten")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                            Spacer()

                            Button {
                                if mealsPerDay < 6 { mealsPerDay += 1 }
                            } label: {
                                Image(systemName: "plus")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(mealsPerDay < 6 ? FrigyBrand.primaryDark : FrigyBrand.textMuted)
                                    .frame(width: 40, height: 40)
                                    .background(Circle().fill(FrigyBrand.primary.opacity(mealsPerDay < 6 ? 0.15 : 0.05)))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(16)
                    .frigyCard(cornerRadius: 16)

                    Spacer().frame(height: 32)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }
}

// MARK: - Shopping sub-views

struct ShoppingCategoryView: View {
    let name: String

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: name)
            Spacer()
            Text("Kategorie: \(name)")
                .foregroundColor(FrigyBrand.textMuted)
            Spacer()
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }
}

struct ShoppingItemDetailView: View {
    let id: String

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: "Artikel")
            Spacer()
            Text("Artikel: \(id)")
                .foregroundColor(FrigyBrand.textMuted)
            Spacer()
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }
}
