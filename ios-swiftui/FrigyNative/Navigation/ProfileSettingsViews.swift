import SwiftUI
import Charts
import UserNotifications

// MARK: - Profile

struct ProfileView: View {
    @Environment(AppRouter.self) private var router
    @Environment(LanguageManager.self) private var lang
    @State private var userEmail: String = ""
    @State private var userName: String = ""
    @State private var isRestoring = false
    @State private var showDeleteConfirm = false
    @State private var isDeletingAccount = false
    @State private var accountDeleteFailed = false

    /// Reads the user's name from the persisted onboarding profile (the same
    /// store EditProfileView reads/writes) so a name edited there shows here.
    private static func loadProfileName() -> String {
        guard let data = UserDefaults.standard.data(forKey: "onboardingPersistedState"),
              let state = try? JSONDecoder().decode(OnboardingPersistedState.self, from: data),
              let name = state.context.userProfile?.name else { return "" }
        return name.trimmingCharacters(in: .whitespaces)
    }

    private var appVersion: String {
        let v = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let b = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "0"
        return "Version \(v) (\(b))"
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Profil"))

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
                        Text(userName.isEmpty ? (userEmail.isEmpty ? lang.t("Mein Profil") : userEmail) : userName)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(FrigyBrand.text)
                            .lineLimit(1)

                        if !userName.isEmpty && !userEmail.isEmpty {
                            Text(userEmail)
                                .font(.system(size: 13))
                                .foregroundColor(FrigyBrand.textMuted)
                                .lineLimit(1)
                        }

                        HStack(spacing: 5) {
                            Image(systemName: router.isPremium ? "crown.fill" : "leaf.fill")
                                .font(.system(size: 11, weight: .bold))
                            Text(router.isPremium ? lang.t("Premium aktiv") : lang.t("Kostenloser Plan"))
                                .font(.system(size: 12, weight: .bold))
                        }
                        .foregroundColor(router.isPremium ? Color(hex: "#F59E0B") : FrigyBrand.primaryDark)
                        .padding(.horizontal, 12).padding(.vertical, 5)
                        .background(Capsule().fill(router.isPremium ? Color(hex: "#FFFBEB") : FrigyBrand.selectedBg))
                        .overlay(Capsule().stroke(router.isPremium ? Color(hex: "#FCD34D") : FrigyBrand.borderMint, lineWidth: 1))
                    }
                    .padding(.top, 8)

                    VStack(spacing: 0) {
                        NavigationLink(destination: EditProfileView().frigyDetailContainer()) {
                            profileRow(lang.t("Profil bearbeiten"), icon: "person.crop.circle.fill", color: FrigyBrand.primaryDark)
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: TransformationView().frigyDetailContainer()) {
                            profileRow(lang.t("Transformation"), icon: "figure.arms.open", color: Color(hex: "#8B5CF6"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: RemindersView().frigyDetailContainer()) {
                            profileRow(lang.t("Benachrichtigungen"), icon: "bell.fill", color: Color(hex: "#FBBF24"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: AppearanceView().frigyDetailContainer()) {
                            profileRow(lang.t("Darstellung"), icon: "circle.lefthalf.filled", color: FrigyBrand.primaryDark)
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: LanguageView().frigyDetailContainer()) {
                            profileRow(lang.t("Sprache"), icon: "globe", color: Color(hex: "#0EA5E9"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: SubscriptionView().frigyDetailContainer()) {
                            profileRow(lang.t("Abonnement"), icon: "crown.fill", color: Color(hex: "#F59E0B"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: PrivacyView().frigyDetailContainer()) {
                            profileRow(lang.t("Datenschutz"), icon: "lock.fill", color: Color(hex: "#A78BFA"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: ImpressumView().frigyDetailContainer()) {
                            profileRow(lang.t("Impressum"), icon: "doc.text.fill", color: Color(hex: "#6366F1"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: AGBView().frigyDetailContainer()) {
                            profileRow(lang.t("AGB"), icon: "doc.badge.gearshape.fill", color: Color(hex: "#3B82F6"))
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 52)
                        NavigationLink(destination: HelpView().frigyDetailContainer()) {
                            profileRow(lang.t("Hilfe & Support"), icon: "questionmark.circle.fill", color: FrigyBrand.textMuted)
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
                                Text(lang.t("Käufe wiederherstellen"))
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
                        Label(lang.t("Abmelden"), systemImage: "rectangle.portrait.and.arrow.right")
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

                    Button { showDeleteConfirm = true } label: {
                        Text(isDeletingAccount ? lang.t("Wird gelöscht…") : lang.t("Konto löschen"))
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(FrigyBrand.textMuted)
                    }
                    .buttonStyle(.plain)
                    .disabled(isDeletingAccount)

                    Text(appVersion)
                        .font(.system(size: 11))
                        .foregroundColor(FrigyBrand.textMuted.opacity(0.7))
                        .padding(.top, 4)

                    Spacer().frame(height: 32)
                }
                .detailContentColumn()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task {
            userEmail = await TrackerDataService.shared.loadUserEmail() ?? ""
            if let premium = try? await router.subscriptionService.refreshPremiumState() {
                router.isPremium = premium
            }
        }
        // Re-read on every appear so a name just edited in EditProfileView (and
        // saved back to the persisted profile) is reflected when we return here.
        .onAppear { userName = Self.loadProfileName() }
        .confirmationDialog(
            lang.t("Konto wirklich löschen?"),
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button(lang.t("Konto löschen"), role: .destructive) {
                Task {
                    isDeletingAccount = true
                    // Delete server-side account + data first (auth user, DB rows).
                    let serverDeleted = await TrackerDataService.shared.deleteAccount()
                    // Clear local data regardless, then sign out.
                    UserDefaults.standard.removeObject(forKey: "frigy.shoppingItems.v2")
                    UserDefaults.standard.removeObject(forKey: "frigy.transformation.photos.v1")
                    UserDefaults.standard.removeObject(forKey: "frigy.reminders.v1")
                    await router.signOut()
                    isDeletingAccount = false
                    if !serverDeleted {
                        accountDeleteFailed = true
                    }
                }
            }
            Button(lang.t("Abbrechen"), role: .cancel) {}
        } message: {
            Text(lang.t("Dein Konto und alle lokalen Daten werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."))
        }
        .alert(lang.t("Serverdaten konnten nicht gelöscht werden"), isPresented: $accountDeleteFailed) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(lang.t("Du wurdest abgemeldet und lokale Daten wurden entfernt, aber dein Konto auf dem Server konnte nicht gelöscht werden. Bitte versuche es später erneut oder kontaktiere den Support."))
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
                .foregroundColor(FrigyBrand.textMuted.opacity(0.5))
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
    @Environment(LanguageManager.self) private var lang
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
                title: lang.t("Transformation"),
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
                            Text(lang.t("Dein Körper-Fortschritt"))
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                            Text(lang.t("Mache regelmäßig Fotos und erhalte KI-Feedback zu deinem Fortschritt."))
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
                            Text(lang.t("Noch keine Fotos"))
                                .font(.system(size: 17, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                            Text(lang.t("Tippe auf + um dein erstes Transformationsfoto hinzuzufügen."))
                                .font(.system(size: 13))
                                .foregroundColor(FrigyBrand.textMuted)
                                .multilineTextAlignment(.center)
                            Button {
                                showAddSheet = true
                            } label: {
                                Label(lang.t("Erstes Foto hinzufügen"), systemImage: "camera.fill")
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
                                Text(lang.t("Vergleich: Anfang vs. Jetzt"))
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(FrigyBrand.text)
                                HStack(spacing: 12) {
                                    photoThumb(photos.first!, label: lang.t("Anfang"))
                                    photoThumb(photos.last!, label: lang.t("Aktuell"))
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
                                    Text(isAnalyzing ? lang.t("Analyse läuft…") : lang.t("KI-Feedback erhalten"))
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
                                    Label(lang.t("KI-Feedback"), systemImage: "sparkles")
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
                            Text(lang.t("Verlauf"))
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
        aiFeedback = reply ?? lang.t("Tolle Arbeit, dass du deinen Fortschritt dokumentierst! Bleib konsequent und mache alle 2 Wochen ein neues Foto, um deinen Fortschritt sichtbar zu machen.")
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
    @Environment(LanguageManager.self) private var lang
    let onSave: (UIImage?, String) -> Void

    @State private var selectedImage: UIImage?
    @State private var noteText = ""
    @State private var showImagePicker = false
    @State private var showCamera = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button(lang.t("Abbrechen")) { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDark)
                Spacer()
                Text(lang.t("Foto hinzufügen"))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
                Spacer()
                Button(lang.t("Speichern")) {
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
                                    Text(lang.t("Foto auswählen"))
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
                            Label(lang.t("Kamera"), systemImage: "camera.fill")
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
                            Label(lang.t("Galerie"), systemImage: "photo.on.rectangle")
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
                        Text(lang.t("Notiz (optional)"))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(FrigyBrand.textMuted)
                        TextField(lang.t("z.B. Nach 4 Wochen Training"), text: $noteText)
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
        // Guard against requesting an unavailable source (e.g. .camera on the
        // Simulator) which raises and crashes. Fall back to the photo library.
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(sourceType)
            ? sourceType
            : .photoLibrary
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
    @Environment(LanguageManager.self) private var lang
    @State private var targets = MacroTargets.default
    @State private var isSaving = false
    @State private var saved = false

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Ernährungsziele"))

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    Text(lang.t("Passe deine täglichen Makroziele an."))
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                        .padding(.top, 4)

                    VStack(spacing: 0) {
                        goalRow(lang.t("Kalorien"), value: $targets.calories, range: 1000...4000, step: 50, unit: "kcal", color: FrigyBrand.primaryDark)
                        Divider().padding(.leading, 16)
                        goalRow(lang.t("Protein"), value: $targets.protein, range: 30...300, step: 5, unit: "g", color: Color(hex: "#60A5FA"))
                        Divider().padding(.leading, 16)
                        goalRow(lang.t("Kohlenhydrate"), value: $targets.carbs, range: 50...600, step: 10, unit: "g", color: Color(hex: "#FBBF24"))
                        Divider().padding(.leading, 16)
                        goalRow(lang.t("Fett"), value: $targets.fat, range: 20...200, step: 5, unit: "g", color: Color(hex: "#F87171"))
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
                                Label(lang.t("Gespeichert"), systemImage: "checkmark.circle.fill")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                            } else {
                                Text(lang.t("Ziele speichern"))
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
                .detailContentColumn()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
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

// MARK: - Appearance

struct AppearanceView: View {
    @Environment(ThemeManager.self) private var theme
    @Environment(LanguageManager.self) private var lang

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Darstellung"))

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    Text(lang.t("Wähle, wie Frigy aussehen soll. Die Änderung wird sofort übernommen."))
                        .font(.system(size: 14))
                        .foregroundColor(FrigyBrand.textMuted)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                        .padding(.top, 12)

                    VStack(spacing: 0) {
                        ForEach(ThemePreference.allCases) { pref in
                            Button {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                                    theme.choose(pref)
                                }
                            } label: {
                                HStack(spacing: 14) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 9)
                                            .fill(FrigyBrand.primary.opacity(theme.preference == pref ? 0.2 : 0.1))
                                            .frame(width: 38, height: 38)
                                        Image(systemName: pref.icon)
                                            .font(.system(size: 17, weight: .semibold))
                                            .foregroundColor(FrigyBrand.primaryDark)
                                    }
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(lang.t(pref.label))
                                            .font(.system(size: 16, weight: .semibold))
                                            .foregroundColor(FrigyBrand.text)
                                        Text(lang.t(pref.subtitle))
                                            .font(.system(size: 12))
                                            .foregroundColor(FrigyBrand.textMuted)
                                    }
                                    Spacer()
                                    if theme.preference == pref {
                                        Image(systemName: "checkmark.circle.fill")
                                            .font(.system(size: 20))
                                            .foregroundColor(FrigyBrand.primaryDark)
                                    }
                                }
                                .padding(14)
                            }
                            .buttonStyle(.plain)
                            if pref != ThemePreference.allCases.last {
                                Divider().padding(.leading, 66)
                            }
                        }
                    }
                    .frigyCard(cornerRadius: 18)
                    .padding(.horizontal, 20)

                    Spacer().frame(height: 40)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }
}

// MARK: - Subscription

struct SubscriptionView: View {
    @Environment(AppRouter.self) private var router
    @Environment(LanguageManager.self) private var lang
    @State private var showPaywall = false
    @State private var packages: [SubscriptionPackage] = []

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Abonnement"))

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
                             ? lang.t("Du hast Zugriff auf alle Premium-Features.")
                             : lang.t("Upgrade auf Premium für alle Features."))
                            .font(.system(size: 14))
                            .foregroundColor(FrigyBrand.textMuted)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }

                    if !router.isPremium {
                        VStack(spacing: 10) {
                            featureRow(lang.t("Unbegrenzte KI-Mahlzeitenpläne"), icon: "sparkles")
                            featureRow(lang.t("KI-Coach ohne Limits"), icon: "brain.head.profile")
                            featureRow(lang.t("Barcode & Foto-Scan"), icon: "camera.fill")
                            featureRow(lang.t("Erweiterte Fortschrittsdiagramme"), icon: "chart.line.uptrend.xyaxis")
                        }
                        .padding(.horizontal, 20)

                        Button { showPaywall = true } label: {
                            let monthly = packages.first { !$0.isYearly }
                            let priceLabel = monthly.map {
                                lang.t("Jetzt upgraden – %1 / %2")
                                    .replacingOccurrences(of: "%1", with: $0.priceString)
                                    .replacingOccurrences(of: "%2", with: $0.period)
                            } ?? lang.t("Jetzt upgraden")
                            Text(priceLabel)
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

                    // Redeem offer code (influencer/promo codes from App Store Connect)
                    Button {
                        router.subscriptionService.redeemOfferCode()
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "gift.fill")
                                .font(.system(size: 15))
                                .foregroundColor(FrigyBrand.primaryDark)
                            Text(lang.t("Gutscheincode einlösen"))
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(FrigyBrand.primaryDark)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(FrigyBrand.selectedBg)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(FrigyBrand.borderMint, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20)

                    Spacer().frame(height: 32)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { packages = await router.subscriptionService.availablePackages() }
        .sheet(isPresented: $showPaywall) {
            PaywallStepView(onBack: nil, onNext: { showPaywall = false })
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
    @Environment(LanguageManager.self) private var lang

    private var sections: [(icon: String, color: String, title: String, text: String)] {
        [
            ("shield.fill",       "#34D399", lang.t("Datenerhebung"),
             lang.t("Frigy speichert nur die Daten, die du aktiv eingibst: Mahlzeiten, Gewicht und deine Profileinstellungen. Alle Daten werden verschlüsselt und sicher in unserer Datenbank gespeichert.")),
            ("hand.raised.fill",  "#60B4FF", lang.t("Datenweitergabe"),
             lang.t("Deine persönlichen Daten werden niemals an Dritte verkauft oder ohne deine ausdrückliche Zustimmung weitergegeben.")),
            ("trash.fill",        "#F87171", lang.t("Datenlöschung"),
             lang.t("Du kannst jederzeit die vollständige Löschung deiner Daten beantragen. Schreib uns einfach an support@frigy.app.")),
            ("brain",             "#A78BFA", lang.t("KI-Verarbeitung"),
             lang.t("Anfragen an den KI-Coach werden verschlüsselt übertragen. Deine Daten werden nicht zur Verbesserung von KI-Modellen verwendet.")),
            ("lock.fill",         "#FBBF24", lang.t("Datensicherheit"),
             lang.t("Wir verwenden branchenübliche Sicherheitsmaßnahmen (TLS, AES-256) um deine Daten zu schützen. Passwörter werden niemals im Klartext gespeichert.")),
        ]
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Datenschutz"))

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    legalBanner(icon: "lock.shield.fill", color: "#34D399",
                                title: lang.t("Deine Daten gehören dir"),
                                subtitle: lang.t("Wir nehmen Datenschutz ernst."))

                    legalCard(sections: sections)

                    legalFooter(lang.t("Letzte Aktualisierung: Januar 2025\nFragen? support@frigy.app"))
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
    }
}

// MARK: - Help

struct HelpView: View {
    @Environment(LanguageManager.self) private var lang

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Hilfe & Support"))

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    VStack(spacing: 0) {
                        contactRow("support@frigy.app", icon: "envelope.fill")
                        Divider().padding(.leading, 52)
                        contactRow("app.frigy.app", icon: "globe")
                    }
                    .frigyCard(cornerRadius: 16)

                    VStack(alignment: .leading, spacing: 0) {
                        Text(lang.t("HÄUFIGE FRAGEN"))
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1.5)
                            .foregroundColor(FrigyBrand.textMuted)
                            .padding(.horizontal, 16)
                            .padding(.bottom, 10)

                        VStack(spacing: 0) {
                            helpRow(lang.t("Wie tracke ich Mahlzeiten?"),
                                    answer: lang.t("Tippe im Home-Tab auf + oder wähle eine Mahlzeitkategorie, um Lebensmittel zu suchen und zu tracken."))
                            Divider().padding(.leading, 16)
                            helpRow(lang.t("Wie ändere ich meine Kalorienziele?"),
                                    answer: lang.t("Gehe zu Profil → Ernährungsziele und passe die Werte mit den Schiebereglern an."))
                            Divider().padding(.leading, 16)
                            helpRow(lang.t("Kann ich Gewicht tracken?"),
                                    answer: lang.t("Ja! Im Home-Tab auf 'Gewicht' tippen, dann auf + um ein neues Gewicht einzutragen."))
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
    @Environment(LanguageManager.self) private var lang
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
                title: lang.t("Gewichtsverlauf"),
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
                            Text(lang.t("Noch keine Gewichtseinträge"))
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(FrigyBrand.text)
                            Text(lang.t("Tippe auf +, um dein erstes Gewicht einzutragen."))
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
                            statCard(lang.t("Aktuell"), value: String(format: "%.1f kg", entries.last?.kg ?? 0), icon: "scalemass.fill")
                            statCard(lang.t("Anfang"), value: String(format: "%.1f kg", entries.first?.kg ?? 0), icon: "flag.fill")
                            let diff = (entries.first?.kg ?? 0) - (entries.last?.kg ?? 0)
                            statCard(diff >= 0 ? lang.t("Verlust") : lang.t("Zuwachs"),
                                     value: String(format: "%.1f kg", abs(diff)),
                                     icon: diff >= 0 ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                        }
                        .padding(.horizontal, 20)

                        VStack(alignment: .leading, spacing: 12) {
                            Text(lang.t("Verlauf"))
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
    @Environment(LanguageManager.self) private var lang
    let onSave: (Double) -> Void

    @State private var text = ""
    @FocusState private var focused: Bool
    @State private var isSaving = false

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                Button(lang.t("Abbrechen")) { dismiss() }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(FrigyBrand.primaryDark)
                    .frame(width: 80, alignment: .leading)
                Spacer()
                Text(lang.t("Gewicht"))
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
                Text(lang.t("Gewicht eintragen"))
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(FrigyBrand.text)
            }

            HStack(spacing: 8) {
                TextField(lang.t("z.B. 74,5"), text: $text)
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

            weightSaveButton
                .padding(.horizontal, 24)
                .padding(.top, 24)

            Spacer()
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .onAppear { focused = true }
    }

    private var weightSaveButton: some View {
        let label: String = isSaving ? lang.t("Wird gespeichert…") : lang.t("Speichern")
        let gradColors: [Color] = text.isEmpty
            ? [FrigyBrand.cardBorder, FrigyBrand.cardBorder]
            : [FrigyBrand.primary, FrigyBrand.primaryDark]
        let strokeOpacity: Double = text.isEmpty ? 0 : 0.35
        let shadowColor: Color = text.isEmpty ? .clear : FrigyBrand.primaryDeep.opacity(0.28)
        return Button {
            let normalized = text.replacingOccurrences(of: ",", with: ".")
            guard let kg = Double(normalized), kg > 0 else { return }
            isSaving = true
            onSave(kg)
            dismiss()
        } label: {
            Text(label)
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(LinearGradient(colors: gradColors, startPoint: .topLeading, endPoint: .bottomTrailing))
                        .overlay(RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(strokeOpacity), lineWidth: 1).blendMode(.overlay))
                )
                .shadow(color: shadowColor, radius: 12, y: 6)
        }
        .disabled(text.isEmpty || isSaving)
        .buttonStyle(.plain)
    }
}

// MARK: - Chatbot

struct ChatbotView: View {
    @Environment(LanguageManager.self) private var lang
    var initialPrompt: String? = nil

    private static let historyKey = "frigy.chat.history.v1"
    private static let maxHistory = 40

    @State private var messages: [(role: String, text: String)] = []
    @State private var inputText = ""
    @State private var isTyping = false
    @State private var didSendInitial = false
    @FocusState private var inputFocused: Bool
    @State private var contextSent = false
    @State private var nutritionContext = ""

    private var quickPrompts: [String] {
        [
            lang.t("Was soll ich heute noch essen?"),
            lang.t("Wie viel Protein fehlt mir noch?"),
            lang.t("Gesunde Snack-Ideen für heute"),
            lang.t("Bin ich auf Kurs mit meinen Zielen?")
        ]
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(
                title: lang.t("KI-Ernährungscoach"),
                trailingIcon: "trash",
                trailingAction: clearHistory
            )

            ScrollViewReader { proxy in
                ScrollView(showsIndicators: false) {
                    LazyVStack(spacing: 12) {
                        if messages.filter({ $0.role == "user" }).isEmpty && !isTyping {
                            quickPromptsSection
                        }
                        ForEach(messages.indices, id: \.self) { i in
                            ChatBubble(text: messages[i].text, isUser: messages[i].role == "user")
                                .id(i)
                        }
                        if isTyping {
                            TypingBubble().id("typing")
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .onChange(of: messages.count) { _, _ in
                    withAnimation { proxy.scrollTo(messages.count - 1) }
                }
                .onChange(of: isTyping) { _, v in
                    if v { withAnimation { proxy.scrollTo("typing") } }
                }
            }

            HStack(spacing: 10) {
                TextField(lang.t("Frag mich etwas..."), text: $inputText, axis: .vertical)
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

                chatSendButton
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial)
            .overlay(Divider(), alignment: .top)
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task {
            loadHistory()
            await loadNutritionContext()
            if let prompt = initialPrompt?.trimmingCharacters(in: .whitespaces),
               !prompt.isEmpty, !didSendInitial {
                didSendInitial = true
                send(prompt)
            }
        }
    }

    @ViewBuilder private var quickPromptsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(lang.t("SCHNELLE FRAGEN"))
                .font(.system(size: 10, weight: .bold))
                .tracking(1.5)
                .foregroundColor(FrigyBrand.textMuted)
                .padding(.leading, 4)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(quickPrompts, id: \.self) { prompt in
                    Button { send(prompt) } label: {
                        Text(prompt)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(FrigyBrand.primaryDark)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(FrigyBrand.selectedBg)
                                    .overlay(RoundedRectangle(cornerRadius: 12)
                                        .stroke(FrigyBrand.borderMint, lineWidth: 1))
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 8)
    }

    private func loadHistory() {
        if let data = UserDefaults.standard.data(forKey: Self.historyKey),
           let saved = try? JSONDecoder().decode([ChatTurn].self, from: data),
           !saved.isEmpty {
            messages = saved.map { ($0.role, $0.content) }
            contextSent = true
        } else {
            messages = [("assistant", lang.t("Hallo! Ich bin dein KI-Ernährungscoach. Wie kann ich dir heute helfen?"))]
        }
    }

    private func saveHistory() {
        let turns = messages.suffix(Self.maxHistory).map { ChatTurn(role: $0.role, content: $0.text) }
        if let data = try? JSONEncoder().encode(Array(turns)) {
            UserDefaults.standard.set(data, forKey: Self.historyKey)
        }
    }

    private func clearHistory() {
        UserDefaults.standard.removeObject(forKey: Self.historyKey)
        contextSent = false
        messages = [("assistant", lang.t("Hallo! Ich bin dein KI-Ernährungscoach. Wie kann ich dir heute helfen?"))]
    }

    private func loadNutritionContext() async {
        let (meals, targets) = await TrackerDataService.shared.loadToday()
        let cal = meals.reduce(0) { $0 + $1.calories }
        let prot = meals.reduce(0) { $0 + $1.protein }
        let carbs = meals.reduce(0) { $0 + $1.carbs }
        let fat = meals.reduce(0) { $0 + $1.fat }
        nutritionContext = "[Heute: \(cal)/\(targets.calories) kcal | Protein: \(prot)g/\(targets.protein)g | Kohlenhydrate: \(carbs)g/\(targets.carbs)g | Fett: \(fat)g/\(targets.fat)g]"
    }

    private var chatSendButton: some View {
        let isEmpty: Bool = inputText.isEmpty
        let circleFill: AnyShapeStyle = isEmpty
            ? AnyShapeStyle(FrigyBrand.cardBorder.opacity(0.4))
            : AnyShapeStyle(LinearGradient(colors: [FrigyBrand.primary, FrigyBrand.primaryDark],
                                           startPoint: .topLeading, endPoint: .bottomTrailing))
        let strokeOpacity: Double = isEmpty ? 0 : 0.35
        let iconColor: Color = isEmpty ? FrigyBrand.textMuted : .white
        let shadowColor: Color = isEmpty ? .clear : FrigyBrand.primaryDeep.opacity(0.25)
        return Button { sendMessage() } label: {
            ZStack {
                Circle()
                    .fill(circleFill)
                    .overlay(Circle().stroke(Color.white.opacity(strokeOpacity), lineWidth: 1).blendMode(.overlay))
                    .frame(width: 36, height: 36)
                Image(systemName: "arrow.up")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(iconColor)
            }
            .shadow(color: shadowColor, radius: 6, y: 3)
        }
        .buttonStyle(.plain)
        .disabled(isEmpty)
    }

    private func sendMessage() {
        let text = inputText
        inputText = ""
        send(text)
    }

    private func send(_ raw: String) {
        let text = raw.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }

        let history = messages.map { ChatTurn(role: $0.role, content: $0.text) }
        messages.append(("user", text))
        isTyping = true
        saveHistory()

        // On the first message, silently prepend today's nutrition data as context.
        let messageToSend: String
        if !contextSent && !nutritionContext.isEmpty {
            contextSent = true
            messageToSend = "\(nutritionContext)\n\n\(text)"
        } else {
            messageToSend = text
        }

        Task {
            let reply = await TrackerDataService.shared.sendChatMessage(messageToSend, history: history)
            isTyping = false
            messages.append((
                "assistant",
                reply ?? lang.t("Ich konnte gerade keine Antwort laden. Bitte prüfe deine Verbindung und versuche es erneut.")
            ))
            saveHistory()
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

struct TypingBubble: View {
    @State private var phase: Double = 0

    var body: some View {
        HStack {
            HStack(spacing: 5) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(FrigyBrand.textMuted)
                        .frame(width: 7, height: 7)
                        .scaleEffect(1 + 0.4 * sin(phase + Double(i) * 0.8))
                        .animation(.easeInOut(duration: 0.5).repeatForever().delay(Double(i) * 0.15), value: phase)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(.ultraThinMaterial)
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.white.opacity(0.25), lineWidth: 1))
            )
            .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
            Spacer()
        }
        .onAppear { phase = .pi * 2 }
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
    @Environment(LanguageManager.self) private var lang

    private var catalog: [BadgeCatalogItem] {
        [
            .init(id: "streak_3",  icon: "flame.fill",          name: lang.t("3-Tage-Serie"),     desc: lang.t("3 Tage in Folge aktiv")),
            .init(id: "streak_7",  icon: "bolt.fill",           name: lang.t("7-Tage-Serie"),     desc: lang.t("Eine ganze Woche!")),
            .init(id: "streak_14", icon: "flame.circle.fill",   name: lang.t("14-Tage-Serie"),    desc: lang.t("Zwei starke Wochen")),
            .init(id: "streak_30", icon: "trophy.fill",         name: lang.t("30-Tage-Serie"),    desc: lang.t("Ein ganzer Monat!")),
            .init(id: "water_goal", icon: "drop.fill",          name: lang.t("Wasserziel"),       desc: lang.t("Tagesziel Wasser erreicht")),
            .init(id: "water_week", icon: "drop.circle.fill",   name: lang.t("Hydration-Held"),   desc: lang.t("7 Tage Wasserziel")),
            .init(id: "first_scan", icon: "camera.fill",        name: lang.t("Erster Scan"),      desc: lang.t("Erste Mahlzeit gescannt")),
            .init(id: "meal_logged", icon: "fork.knife",        name: lang.t("Erste Mahlzeit"),   desc: lang.t("Erste Mahlzeit getrackt")),
            .init(id: "weight_tracked", icon: "scalemass.fill", name: lang.t("Gewicht getrackt"), desc: lang.t("Erstes Gewicht erfasst")),
            .init(id: "calorie_goal_3", icon: "target",         name: lang.t("3 Tage im Ziel"),  desc: lang.t("3 Tage im Kalorienbudget")),
            .init(id: "calorie_goal_7", icon: "diamond.fill",   name: lang.t("7 Tage im Ziel"),  desc: lang.t("7 Tage im Kalorienbudget")),
            .init(id: "protein_champion", icon: "bolt.heart.fill", name: lang.t("Protein-Champion"), desc: lang.t("5× Proteinziel erreicht")),
            .init(id: "scanner_pro", icon: "iphone",            name: lang.t("Scanner-Profi"),    desc: lang.t("20 Mahlzeiten gescannt")),
            .init(id: "weight_loss_1", icon: "arrow.down.circle.fill", name: lang.t("Erstes Kilo"), desc: lang.t("1 kg abgenommen")),
            .init(id: "weight_loss_5", icon: "medal.fill",      name: lang.t("Fünf Kilo"),        desc: lang.t("5 kg abgenommen")),
            .init(id: "calorie_week_perfect", icon: "sparkles", name: lang.t("Perfekte Woche"),   desc: lang.t("7 Tage in Folge im Budget")),
            .init(id: "comeback",   icon: "arrow.clockwise",    name: lang.t("Comeback"),         desc: lang.t("Nach Pause zurück")),
        ]
    }

    @State private var unlockedTypes: Set<String> = []

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Abzeichen"))

            ScrollView(showsIndicators: false) {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                    ForEach(catalog) { badge in
                        let unlocked = unlockedTypes.contains(badge.id.lowercased())
                        VStack(spacing: 10) {
                            ZStack {
                                Circle()
                                    .fill(unlocked ? FrigyBrand.selectedBg : Color(UIColor.secondarySystemBackground))
                                    .frame(width: 60, height: 60)
                                Image(systemName: badge.icon)
                                    .font(.system(size: 26, weight: .semibold))
                                    .foregroundColor(unlocked ? FrigyBrand.primaryDark : FrigyBrand.textMuted.opacity(0.4))
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
        // Normalize so casing/whitespace drift from the DB still matches catalog ids.
        unlockedTypes = Set(earned.map { $0.type.lowercased().trimmingCharacters(in: .whitespaces) })
    }
}

// MARK: - Food Entry

struct FoodEntryView: View {
    let entryId: String
    @State private var entry: LoggedMeal? = nil
    @State private var isLoading = true
    @Environment(LanguageManager.self) private var lang

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Eintrag"))

            if isLoading {
                Spacer()
                ProgressView()
                Spacer()
            } else if let meal = entry {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        VStack(spacing: 10) {
                            Text(meal.category.emoji)
                                .font(.system(size: 56))
                            Text(meal.name)
                                .font(.system(size: 22, weight: .black))
                                .foregroundColor(FrigyBrand.text)
                                .multilineTextAlignment(.center)
                            if !meal.time.isEmpty {
                                HStack(spacing: 5) {
                                    Image(systemName: "clock").font(.system(size: 12))
                                    Text(meal.time).font(.system(size: 13, weight: .medium))
                                }
                                .foregroundColor(FrigyBrand.textMuted)
                            }
                        }
                        .padding(.top, 12)

                        HStack(spacing: 10) {
                            entryMacroChip(lang.t("Kalorien"), value: "\(meal.calories)", unit: "kcal", color: FrigyBrand.primaryDark)
                            entryMacroChip(lang.t("Protein"),  value: "\(meal.protein)",  unit: "g",    color: Color(hex: "#60A5FA"))
                            entryMacroChip(lang.t("Kohlenhydrate"), value: "\(meal.carbs)", unit: "g",  color: Color(hex: "#FBBF24"))
                            entryMacroChip(lang.t("Fett"),     value: "\(meal.fat)",      unit: "g",    color: Color(hex: "#F87171"))
                        }
                        .padding(.horizontal, 20)

                        Spacer().frame(height: 32)
                    }
                }
            } else {
                Spacer()
                VStack(spacing: 14) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 44))
                        .foregroundColor(FrigyBrand.cardBorder)
                    Text(lang.t("Eintrag nicht verfügbar"))
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(FrigyBrand.text)
                    Text(lang.t("Dieser Lebensmitteleintrag konnte nicht geladen werden."))
                        .font(.system(size: 13))
                        .foregroundColor(FrigyBrand.textMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
                Spacer()
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task {
            let result = await TrackerDataService.shared.loadToday()
            entry = result.meals.first { $0.entryId == entryId }
            isLoading = false
        }
    }

    private func entryMacroChip(_ label: String, value: String, unit: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundColor(color)
            Text(unit)
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(color.opacity(0.7))
            Text(label)
                .font(.system(size: 10))
                .foregroundColor(FrigyBrand.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .frigyCard(cornerRadius: 12)
    }
}

// MARK: - Meal Detail

struct MealDetailView: View {
    let id: String
    @State private var isSaving = false
    @State private var hasLogged = false
    @Environment(MainTabCoordinator.self) private var tabCoordinator
    @Environment(LanguageManager.self) private var lang

    /// Generated week-plan meals are looked up by UUID from the persisted plan.
    /// Falls back to the static `FoodTemplate` lookup-by-name for any other callers.
    private var plannedMeal: PlannedMeal? {
        guard let uuid = UUID(uuidString: id),
              let data = UserDefaults.standard.data(forKey: weekPlanKey),
              let days = try? JSONDecoder().decode([DayPlan].self, from: data) else { return nil }
        return days.flatMap(\.meals).first { $0.id == uuid }
    }

    private var template: FoodTemplate? { FoodTemplate.all.first { $0.name == id } }

    private var steps: [CookingStep] {
        guard let meal = plannedMeal else { return [] }
        return CookingInstructions.generateSteps(mealName: meal.name, prepTime: meal.duration, ingredients: meal.ingredients)
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: plannedMeal?.name ?? template?.name ?? id)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    if let meal = plannedMeal {
                        VStack(spacing: 10) {
                            Text(meal.category.emoji).font(.system(size: 56))
                            Text(meal.name)
                                .font(.system(size: 22, weight: .black))
                                .foregroundColor(FrigyBrand.text)
                                .multilineTextAlignment(.center)
                            HStack(spacing: 5) {
                                Image(systemName: "clock").font(.system(size: 11))
                                Text("\(meal.duration) \(lang.t("Min."))").font(.system(size: 13, weight: .medium))
                            }
                            .foregroundColor(FrigyBrand.textMuted)
                        }
                        .frame(maxWidth: .infinity).padding(.top, 12)

                        HStack(spacing: 10) {
                            mealDetailMacroChip(lang.t("Kalorien"), value: "\(meal.calories)", unit: "kcal", color: FrigyBrand.primaryDark)
                            mealDetailMacroChip(lang.t("Protein"),  value: "\(meal.protein)",  unit: "g",    color: Color(hex: "#60A5FA"))
                            mealDetailMacroChip(lang.t("Kohlenhydrate"), value: "\(meal.carbs)", unit: "g",  color: Color(hex: "#FBBF24"))
                            mealDetailMacroChip(lang.t("Fett"),     value: "\(meal.fat)",      unit: "g",    color: Color(hex: "#F87171"))
                        }
                        .padding(.horizontal, 20)

                        if !meal.ingredients.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Label(lang.t("Zutaten"), systemImage: "basket")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(FrigyBrand.text)
                                VStack(alignment: .leading, spacing: 6) {
                                    ForEach(Array(meal.ingredients.enumerated()), id: \.offset) { _, ing in
                                        HStack {
                                            Text(ing.name).font(.system(size: 14)).foregroundColor(FrigyBrand.text)
                                            Spacer()
                                            Text(ing.amount).font(.system(size: 13)).foregroundColor(FrigyBrand.textMuted)
                                        }
                                    }
                                }
                            }
                            .padding(16)
                            .frigyCard(cornerRadius: 18)
                            .padding(.horizontal, 20)
                        }

                        VStack(alignment: .leading, spacing: 12) {
                            Label(lang.t("Zubereitung"), systemImage: "list.bullet")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                            VStack(alignment: .leading, spacing: 14) {
                                ForEach(Array(steps.enumerated()), id: \.offset) { i, step in
                                    HStack(alignment: .top, spacing: 10) {
                                        Text("\(i + 1)")
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundColor(.white)
                                            .frame(width: 22, height: 22)
                                            .background(Circle().fill(FrigyBrand.primary))
                                        VStack(alignment: .leading, spacing: 4) {
                                            HStack(spacing: 6) {
                                                Text(lang.t(step.phase))
                                                    .font(.system(size: 10, weight: .bold))
                                                    .foregroundColor(FrigyBrand.primaryDark)
                                                Text("· \(step.minutes) \(lang.t("Min."))")
                                                    .font(.system(size: 10, weight: .medium))
                                                    .foregroundColor(FrigyBrand.textMuted)
                                            }
                                            Text(step.text)
                                                .font(.system(size: 14))
                                                .foregroundColor(FrigyBrand.text)
                                                .fixedSize(horizontal: false, vertical: true)
                                            if let tip = step.tip {
                                                Text("\(lang.t("Tipp")): \(tip)")
                                                    .font(.system(size: 12))
                                                    .foregroundColor(FrigyBrand.textMuted)
                                                    .fixedSize(horizontal: false, vertical: true)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        .padding(16)
                        .frigyCard(cornerRadius: 18)
                        .padding(.horizontal, 20)

                        Button {
                            isSaving = true
                            Task {
                                let ok = await TrackerDataService.shared.addFoodEntry(
                                    name: meal.name, calories: meal.calories,
                                    protein: meal.protein, carbs: meal.carbs, fat: meal.fat,
                                    portion: nil, category: meal.category
                                )
                                isSaving = false
                                if ok {
                                    hasLogged = true
                                    NotificationCenter.default.post(name: .trackerDidAddEntry, object: nil)
                                }
                            }
                        } label: {
                            HStack(spacing: 8) {
                                if isSaving { ProgressView().tint(.white) }
                                Text(isSaving ? lang.t("Wird gespeichert…") : (hasLogged ? lang.t("Geloggt ✓") : lang.t("Zu Tagebuch hinzufügen")))
                                    .font(.system(size: 16, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(FrigyBrand.buttonGradient)
                            .clipShape(RoundedRectangle(cornerRadius: 18))
                        }
                        .buttonStyle(.plain).disabled(isSaving || hasLogged)
                        .padding(.horizontal, 20)
                    } else if let tpl = template {
                        VStack(spacing: 10) {
                            Text(tpl.emoji).font(.system(size: 56))
                            Text(tpl.name)
                                .font(.system(size: 22, weight: .black))
                                .foregroundColor(FrigyBrand.text)
                                .multilineTextAlignment(.center)
                            HStack(spacing: 5) {
                                Image(systemName: "clock").font(.system(size: 11))
                                Text(tpl.prepTime).font(.system(size: 13, weight: .medium))
                            }
                            .foregroundColor(FrigyBrand.textMuted)
                        }
                        .frame(maxWidth: .infinity).padding(.top, 12)

                        HStack(spacing: 10) {
                            mealDetailMacroChip(lang.t("Kalorien"), value: "\(tpl.calories)", unit: "kcal", color: FrigyBrand.primaryDark)
                            mealDetailMacroChip(lang.t("Protein"),  value: "\(tpl.protein)",  unit: "g",    color: Color(hex: "#60A5FA"))
                            mealDetailMacroChip(lang.t("Kohlenhydrate"), value: "\(tpl.carbs)", unit: "g",  color: Color(hex: "#FBBF24"))
                            mealDetailMacroChip(lang.t("Fett"),     value: "\(tpl.fat)",      unit: "g",    color: Color(hex: "#F87171"))
                        }
                        .padding(.horizontal, 20)

                        VStack(alignment: .leading, spacing: 10) {
                            Label(lang.t("Zubereitung"), systemImage: "list.bullet")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(FrigyBrand.text)
                            Text(tpl.recipe)
                                .font(.system(size: 14))
                                .foregroundColor(FrigyBrand.textMuted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(16)
                        .frigyCard(cornerRadius: 18)
                        .padding(.horizontal, 20)

                        Button {
                            isSaving = true
                            Task {
                                await TrackerDataService.shared.addFoodEntry(
                                    name: tpl.name, calories: tpl.calories,
                                    protein: tpl.protein, carbs: tpl.carbs, fat: tpl.fat,
                                    portion: lang.t("1 Portion"), category: .current()
                                )
                                isSaving = false
                            }
                        } label: {
                            HStack(spacing: 8) {
                                if isSaving { ProgressView().tint(.white) }
                                Text(isSaving ? lang.t("Wird gespeichert…") : lang.t("Zu Tagebuch hinzufügen"))
                                    .font(.system(size: 16, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(FrigyBrand.buttonGradient)
                            .clipShape(RoundedRectangle(cornerRadius: 18))
                        }
                        .buttonStyle(.plain).disabled(isSaving)
                        .padding(.horizontal, 20)
                    } else {
                        VStack(spacing: 14) {
                            Image(systemName: "fork.knife").font(.system(size: 44))
                                .foregroundColor(FrigyBrand.cardBorder)
                            Text(id).font(.system(size: 20, weight: .bold))
                                .foregroundColor(FrigyBrand.text).multilineTextAlignment(.center)
                            Text(lang.t("Füge diese Mahlzeit über den + Button zu deinem Tagebuch hinzu."))
                                .font(.system(size: 14)).foregroundColor(FrigyBrand.textMuted)
                                .multilineTextAlignment(.center).padding(.horizontal, 24)
                        }
                        .frame(maxWidth: .infinity).padding(.top, 60)
                    }

                    Spacer().frame(height: 40)
                }
            }
        }
        .background(FrigyGlassBackground().ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
    }

    private func mealDetailMacroChip(_ label: String, value: String, unit: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 18, weight: .black, design: .rounded)).foregroundColor(color)
            Text(unit).font(.system(size: 10, weight: .bold)).foregroundColor(color.opacity(0.7))
            Text(label).font(.system(size: 10)).foregroundColor(FrigyBrand.textMuted)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 10).frigyCard(cornerRadius: 12)
    }
}

// MARK: - Reminders

struct ReminderItem: Identifiable, Codable, Equatable {
    var id: String
    var hour: Int
    var minute: Int
    var label: String
    var emoji: String
    var enabled: Bool

    init(id: String, hour: Int, minute: Int, label: String, emoji: String, enabled: Bool) {
        self.id = id; self.hour = hour; self.minute = minute
        self.label = label; self.emoji = emoji; self.enabled = enabled
    }

    // Backwards-compatible decode: emoji defaults to "" if missing from stored data
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id      = try c.decode(String.self, forKey: .id)
        hour    = try c.decode(Int.self,    forKey: .hour)
        minute  = try c.decode(Int.self,    forKey: .minute)
        label   = try c.decode(String.self, forKey: .label)
        emoji   = (try? c.decode(String.self, forKey: .emoji)) ?? ""
        enabled = try c.decode(Bool.self,   forKey: .enabled)
    }

    var timeString: String { String(format: "%02d:%02d", hour, minute) }
}

private let remindersKey = "frigy.reminders.v1"

struct RemindersView: View {
    @Environment(LanguageManager.self) private var lang
    @State private var reminders: [ReminderItem] = Self.defaultReminders()
    @State private var permissionStatus: UNAuthorizationStatus = .notDetermined
    @State private var expandedId: String? = nil

    private var isDenied: Bool { permissionStatus == .denied }
    private var hasPermission: Bool { permissionStatus == .authorized || permissionStatus == .provisional }

    private static func defaultReminders() -> [ReminderItem] {
        if let data = UserDefaults.standard.data(forKey: remindersKey),
           let saved = try? JSONDecoder().decode([ReminderItem].self, from: data) {
            return saved
        }
        return [
            ReminderItem(id: "frigy.breakfast", hour: 8,  minute: 0,  label: "Frühstück tracken",   emoji: "🍳", enabled: true),
            ReminderItem(id: "frigy.lunch",     hour: 12, minute: 30, label: "Mittagessen tracken", emoji: "🥗", enabled: true),
            ReminderItem(id: "frigy.dinner",    hour: 19, minute: 0,  label: "Abendessen tracken",  emoji: "🍝", enabled: false),
            ReminderItem(id: "frigy.snack",     hour: 15, minute: 30, label: "Snack tracken",       emoji: "🍎", enabled: false),
        ]
    }

    var body: some View {
        VStack(spacing: 0) {
            FrigyNavBar(title: lang.t("Erinnerungen"))

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    // Permission banner
                    if !hasPermission {
                        VStack(alignment: .leading, spacing: 10) {
                            Label(
                                isDenied
                                    ? lang.t("Benachrichtigungen blockiert")
                                    : lang.t("Benachrichtigungen aktivieren"),
                                systemImage: isDenied ? "bell.slash.fill" : "bell.badge.fill"
                            )
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(isDenied ? Color(hex: "#EF4444") : Color(hex: "#F59E0B"))

                            Text(isDenied
                                 ? lang.t("Öffne die Einstellungen und erlaube Frigy Benachrichtigungen zu senden.")
                                 : lang.t("Aktiviere Benachrichtigungen, um tägliche Mahlzeit-Erinnerungen zu erhalten."))
                                .font(.system(size: 13))
                                .foregroundColor(FrigyBrand.textMuted)

                            Button {
                                if isDenied {
                                    if let url = URL(string: UIApplication.openSettingsURLString) {
                                        UIApplication.shared.open(url)
                                    }
                                } else {
                                    Task { await requestPermission() }
                                }
                            } label: {
                                Text(isDenied ? lang.t("Einstellungen öffnen") : lang.t("Jetzt aktivieren"))
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
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(16)
                        .frigyCard(cornerRadius: 16)
                    }

                    VStack(spacing: 0) {
                        ForEach($reminders) { $reminder in
                            VStack(spacing: 0) {
                                HStack {
                                    Text(reminder.emoji)
                                        .font(.system(size: 26))
                                        .frame(width: 36)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Button {
                                            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                                expandedId = expandedId == reminder.id ? nil : reminder.id
                                            }
                                        } label: {
                                            HStack(spacing: 6) {
                                                Text(reminder.timeString)
                                                    .font(.system(size: 18, weight: .bold, design: .monospaced))
                                                    .foregroundColor(FrigyBrand.text)
                                                Image(systemName: expandedId == reminder.id ? "chevron.up" : "pencil")
                                                    .font(.system(size: 11, weight: .semibold))
                                                    .foregroundColor(FrigyBrand.primaryDark)
                                            }
                                        }
                                        .buttonStyle(.plain)
                                        Text(lang.t(reminder.label))
                                            .font(.system(size: 13))
                                            .foregroundColor(FrigyBrand.textMuted)
                                    }
                                    Spacer()
                                    Toggle("", isOn: $reminder.enabled)
                                        .tint(FrigyBrand.primaryDark)
                                        .onChange(of: reminder.enabled) { _, _ in
                                            if !hasPermission && reminder.enabled {
                                                Task { await requestPermission() }
                                            }
                                            scheduleOrCancel(reminder)
                                            save()
                                        }
                                }
                                .padding(14)

                                if expandedId == reminder.id {
                                    VStack(spacing: 4) {
                                        Divider().padding(.leading, 16)
                                        DatePicker(
                                            "",
                                            selection: Binding(
                                                get: {
                                                    var c = Calendar.current.dateComponents([.hour, .minute], from: Date())
                                                    c.hour = reminder.hour; c.minute = reminder.minute
                                                    return Calendar.current.date(from: c) ?? Date()
                                                },
                                                set: { date in
                                                    let c = Calendar.current.dateComponents([.hour, .minute], from: date)
                                                    reminder.hour = c.hour ?? reminder.hour
                                                    reminder.minute = c.minute ?? reminder.minute
                                                    scheduleOrCancel(reminder)
                                                    save()
                                                }
                                            ),
                                            displayedComponents: .hourAndMinute
                                        )
                                        .datePickerStyle(.wheel)
                                        .labelsHidden()
                                        .tint(FrigyBrand.primaryDark)
                                        .padding(.horizontal, 16)
                                        .padding(.bottom, 8)
                                    }
                                    .transition(.opacity.combined(with: .move(edge: .top)))
                                }
                            }
                            if reminder.id != reminders.last?.id {
                                Divider().padding(.leading, 60)
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
        .task {
            await refreshPermissionStatus()
            // On first visit with undetermined status: ask immediately so the user
            // doesn't have to tap a button to get the system dialog.
            if permissionStatus == .notDetermined {
                await requestPermission()
            }
            // (Re-)schedule all enabled reminders so they survive app reinstalls
            // or cases where the system purged pending notifications.
            if hasPermission {
                for r in reminders where r.enabled { scheduleOrCancel(r) }
            }
        }
    }

    // MARK: - Persistence

    private func save() {
        if let data = try? JSONEncoder().encode(reminders) {
            UserDefaults.standard.set(data, forKey: remindersKey)
        }
    }

    // MARK: - Scheduling

    private func scheduleOrCancel(_ item: ReminderItem) {
        let center = UNUserNotificationCenter.current()
        // Always remove first — guarantees exactly one pending request per identifier,
        // even if this function is called multiple times or center.add was called before.
        center.removePendingNotificationRequests(withIdentifiers: [item.id])
        guard item.enabled else { return }

        let content = UNMutableNotificationContent()
        content.title = "\(item.emoji) \(lang.t(item.label))"
        content.body  = notificationBody(for: item)
        content.sound = .default
        content.badge = 1

        var comps = DateComponents()
        comps.hour   = item.hour
        comps.minute = item.minute
        // dateMatching with only hour+minute fires once per day — no duplicates possible.
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
        center.add(UNNotificationRequest(identifier: item.id, content: content, trigger: trigger))
    }

    private func notificationBody(for item: ReminderItem) -> String {
        switch item.id {
        case "frigy.breakfast": return lang.t("Guten Morgen! ☀️ Zeit, dein Frühstück in Frigy zu tracken.")
        case "frigy.lunch":     return lang.t("Mittagspause! 🕛 Vergiss nicht, dein Mittagessen zu loggen.")
        case "frigy.dinner":    return lang.t("Abendzeit! 🌙 Trag dein Abendessen ein und schau, wie dein Tag war.")
        case "frigy.snack":     return lang.t("Snack-Zeit! 🍎 Kleiner Hunger? Tracke deinen Snack.")
        default:                return lang.t("Zeit zum Tracken in Frigy! 📊")
        }
    }

    // MARK: - Permission

    private func refreshPermissionStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        permissionStatus = settings.authorizationStatus
    }

    private func requestPermission() async {
        let granted = (try? await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        permissionStatus = granted ? .authorized : .denied
        if granted {
            // Now that we have permission, schedule all enabled reminders
            for r in reminders where r.enabled { scheduleOrCancel(r) }
        }
    }
}
