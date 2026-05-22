import type { Language } from "./LanguageContext";

/** UI strings not yet in the main LanguageContext block — merged at runtime. */
export interface ExtendedTranslations {
  toastPleaseLogin: string;
  toastCopiedToClipboard: string;
  frigyCommunityShareTitle: string;

  communityPageTitle: string;
  communityPageSubtitle: string;
  communityShareRecipe: string;
  communityStatMembers: string;
  communityStatRecipes: string;
  communityStatSuccess: string;
  communityTabRecipes: string;
  communityTabPosts: string;
  communityLoadingRecipes: string;
  communityEmptyRecipesTitle: string;
  communityEmptyRecipesDesc: string;
  communityFirstRecipeBtn: string;
  communityMoreIngredients: string;
  timeAgoMinutes: string;
  timeAgoHours: string;
  timeAgoDays: string;

  landingHeroTitle: string;
  landingHeroSubtitle: string;
  landingStartFreeBtn: string;
  landingSignInBtn: string;
  landingPreviewScanned: string;
  landingPreviewRecipesFound: string;
  landingFeaturesHeading: string;
  landingFeaturesSubheading: string;
  landingPremiumHeading: string;
  landingPremiumSubheading: string;
  landingPopularBadge: string;
  landingPremiumDiscover: string;
  landingTestimonialsHeading: string;
  landingAppStoreHeading: string;
  landingAppStoreSubheading: string;
  landingAppStoreSoon: string;
  landingPlayStoreSoon: string;
  landingCtaHeading: string;
  landingCtaSubheading: string;
  landingFooterRights: string;
  landingFeatureScanTitle: string;
  landingFeatureScanDesc: string;
  landingFeatureCaloriesTitle: string;
  landingFeatureCaloriesDesc: string;
  landingFeatureWeightTitle: string;
  landingFeatureWeightDesc: string;
  landingFeatureWaterTitle: string;
  landingFeatureWaterDesc: string;
  landingFeatureCommunityTitle: string;
  landingFeatureCommunityDesc: string;
  landingFeatureHealthTitle: string;
  landingFeatureHealthDesc: string;
  landingTestimonial1: string;
  landingTestimonial2: string;
  landingTestimonial3: string;
  landingPremiumFeature1: string;
  landingPremiumFeature2: string;
  landingPremiumFeature3: string;
  landingPremiumFeature4: string;
  landingPremiumFeature5: string;
  landingPremiumFeature6: string;
  landingPremiumFeature7: string;
  landingPremiumFeature8: string;

  manualIngredientsTitle: string;
  manualIngredientsHighlight: string;
  manualWhatAtHome: string;
  manualIngredientPlaceholder: string;
  manualAddOneIngredient: string;

  notFoundTitle: string;
  notFoundMessage: string;
  notFoundBackHome: string;

  recipeIngredientsHeading: string;
  recipeInstructionsHeading: string;
  recipeNutritionHeading: string;
  recipeDifficultyLabel: string;
  preparation: string;
  difficultyMedium: string;

  regenerateWeeklyPlan: string;
  macroGoalsChangedToast: string;
  ariaGenerateWeeklyPlan: string;
  toastRecipeAddFailed: string;
  trackerPersonalMacroPlan: string;
  trackerSetupLaterHint: string;
  ariaAnalyzingFood: string;

  postPayCoachTitle: string;
  postPayCoachBody: string;
  scanNow: string;
  laterBtn: string;
  ariaOpenBadges: string;
  aiChatbotTitle: string;

  settingsSubscriptionGroup: string;
  settingsOpeningPortal: string;
  settingsAccountGroup: string;
  settingsCommunity: string;
  settingsRestartOnboarding: string;
  deleteAccountConfirmTitle: string;
  deleteAccountConfirmDesc: string;

  recipesAlmostDone: string;
  recipesClarificationTitle: string;
  recipesClarificationDesc: string;
  scanAgain: string;
  yourDish: string;
  budgetAfterMeal: string;

  createWeeklyPlan: string;
  mealPlanShoppingHint: string;
  toastMealAddFailed: string;
  toastMealSaveFailed: string;

  toastEnterWeight: string;
  toastWeightRange: string;
  noWeightLoggedYet: string;
  ariaEditCurrentWeight: string;
  weightInputPlaceholder: string;

  toastNotificationsEnabled: string;
  toastNotificationsDenied: string;
  notificationsDisabledTitle: string;
  notificationsDisabledDesc: string;
  enableNotifications: string;
  reminderWaterLabel: string;
  reminderMealsLabel: string;
  reminderWeighLabel: string;

  addMealWhatEating: string;
  addMealScan: string;
  addMealManual: string;
  addMealSearch: string;

  adminNoAccessTitle: string;
  adminNoAccessDesc: string;
  adminBackToApp: string;
  adminPanelTitle: string;
  adminGrantPremiumTitle: string;
  adminGrantPremiumDesc: string;
  adminUserEmailLabel: string;
  adminEmailPlaceholder: string;
  adminDurationLabel: string;
  adminDurationOneYear: string;
  adminReasonLabel: string;
  adminReasonPlaceholder: string;
  toastEnterEmail: string;
  adminGrantPremiumButton: string;
  adminPremiumGranted: string;
  adminPremiumGrantFailed: string;
  adminGranting: string;

  shareRecipeTitle: string;
  recipeTitlePlaceholder: string;
  recipeDescPlaceholder: string;
  toastLoginRequired: string;
  toastTitleRequired: string;
  toastRecipeShared: string;
  toastRecipeShareFailed: string;

  healthSyncTitle: string;
  healthSyncWeightPlaceholder: string;

  orderIngredientsBtn: string;
  shareRecipeBtn: string;
  addToTrackerBtn: string;

  onboardingWelcomeHeadline1: string;
  onboardingWelcomeHeadline2: string;
  onboardingWelcomeSubline: string;
  onboardingGetStarted: string;
  onboardingCommunityStepTitle: string;
  onboardingCommunityStepDesc: string;
  ariaBack: string;

  toastCameraPermission: string;
  loadingStripePortal: string;

  recipeHealthierAlternatives: string;
  recipePrepTimeMin: string;
  carbsMacroLabel: string;
  fatMacroLabel: string;
  postPayCoachBody2: string;
  postPayCoachBody3: string;
  postPayCoachScanLine: string;
  postPayCoachShoppingLine: string;
}

export const extendedTranslations: Record<Language, ExtendedTranslations> = {
  de: {
    toastPleaseLogin: "Bitte einloggen",
    toastCopiedToClipboard: "In Zwischenablage kopiert!",
    frigyCommunityShareTitle: "Frigy Community",

    communityPageTitle: "Community",
    communityPageSubtitle: "Rezepte, Ideen & Motivation",
    communityShareRecipe: "Rezept teilen",
    communityStatMembers: "Mitglieder",
    communityStatRecipes: "Rezepte",
    communityStatSuccess: "Erfolgsrate",
    communityTabRecipes: "Rezepte",
    communityTabPosts: "Beiträge",
    communityLoadingRecipes: "Rezepte werden geladen...",
    communityEmptyRecipesTitle: "Noch keine Rezepte",
    communityEmptyRecipesDesc: "Sei der Erste, der ein Rezept teilt!",
    communityFirstRecipeBtn: "Erstes Rezept teilen",
    communityMoreIngredients: "mehr",
    timeAgoMinutes: "vor {n} Min.",
    timeAgoHours: "vor {n} Std.",
    timeAgoDays: "vor {n} Tagen",

    landingHeroTitle: "Abnehmen war noch nie so einfach",
    landingHeroSubtitle:
      "Scanne deinen Kühlschrank, erhalte personalisierte Rezepte und erreiche dein Wunschgewicht mit KI-Unterstützung.",
    landingStartFreeBtn: "Kostenlos starten",
    landingSignInBtn: "Anmelden",
    landingPreviewScanned: "Kühlschrank gescannt",
    landingPreviewRecipesFound: "3 Rezepte gefunden",
    landingFeaturesHeading: "Alles was du brauchst",
    landingFeaturesSubheading: "Eine App für deinen kompletten Abnehm-Erfolg",
    landingPremiumHeading: "Premium starten",
    landingPremiumSubheading: "Premium-Funktionen für deine Ernährung und deinen Fortschritt",
    landingPopularBadge: "Beliebt",
    landingPremiumDiscover: "Premium entdecken",
    landingTestimonialsHeading: "Was andere sagen",
    landingAppStoreHeading: "Bald im App Store",
    landingAppStoreSubheading: "Verfügbar für iOS und Android",
    landingAppStoreSoon: "App Store (Bald)",
    landingPlayStoreSoon: "Play Store (Bald)",
    landingCtaHeading: "Bereit für deine Transformation?",
    landingCtaSubheading:
      "Schließe dich tausenden an, die bereits ihr Wunschgewicht erreicht haben.",
    landingFooterRights: "© 2026 Frigy. Alle Rechte vorbehalten.",
    landingFeatureScanTitle: "Kühlschrank scannen",
    landingFeatureScanDesc:
      "Fotografiere deinen Kühlschrank und erhalte sofort passende Rezepte.",
    landingFeatureCaloriesTitle: "Kalorien-Tracking",
    landingFeatureCaloriesDesc:
      "Verfolge deine Kalorien und Makros automatisch mit KI-Analyse.",
    landingFeatureWeightTitle: "Gewichtsverlust",
    landingFeatureWeightDesc: "Personalisierte Pläne für nachhaltiges Abnehmen.",
    landingFeatureWaterTitle: "Wasser-Tracker",
    landingFeatureWaterDesc: "Bleib hydratisiert mit täglichen Erinnerungen.",
    landingFeatureCommunityTitle: "Community",
    landingFeatureCommunityDesc: "Teile Rezepte und verbinde dich mit anderen.",
    landingFeatureHealthTitle: "Health-Sync",
    landingFeatureHealthDesc: "Synchronisiere mit Apple Health & Google Fit.",
    landingTestimonial1: "Endlich eine App, die versteht was ich im Kühlschrank habe!",
    landingTestimonial2: "12kg in 3 Monaten abgenommen. Die Meal Plans sind perfekt.",
    landingTestimonial3: "Die Community ist super motivierend!",
    landingPremiumFeature1: "Unbegrenzte Scans",
    landingPremiumFeature2: "KI-Chatbot",
    landingPremiumFeature3: "Wöchentliche Meal Plans",
    landingPremiumFeature4: "Einkaufslisten",
    landingPremiumFeature5: "Makro-Tracking",
    landingPremiumFeature6: "Wasser-Tracker",
    landingPremiumFeature7: "Community-Zugang",
    landingPremiumFeature8: "Health-Sync",

    manualIngredientsTitle: "Zutaten",
    manualIngredientsHighlight: "eingeben",
    manualWhatAtHome: "Was hast du zu Hause?",
    manualIngredientPlaceholder: "z.B. Tomaten, Hähnchen, Joghurt...",
    manualAddOneIngredient: "Füge mindestens eine Zutat hinzu, um zu starten",

    notFoundTitle: "404",
    notFoundMessage: "Seite nicht gefunden",
    notFoundBackHome: "Zur Startseite",

    recipeIngredientsHeading: "Zutaten",
    recipeInstructionsHeading: "Zubereitung",
    recipeNutritionHeading: "Nährwerte",
    recipeDifficultyLabel: "Schwierigkeit",
    preparation: "Zubereitung",
    difficultyMedium: "Mittel",

    regenerateWeeklyPlan: "Wochenplan neu generieren",
    macroGoalsChangedToast:
      "Deine Makroziele wurden angepasst. Damit dein Wochenplan wieder perfekt passt, solltest du ihn neu erstellen.",
    ariaGenerateWeeklyPlan: "Wochenplan generieren",
    toastRecipeAddFailed: "Rezept konnte nicht hinzugefügt werden",
    trackerPersonalMacroPlan: "Dein persönlicher Makro-Plan",
    trackerSetupLaterHint: "Du kannst dich später jederzeit noch umstellen.",
    ariaAnalyzingFood: "Essen wird analysiert",

    postPayCoachTitle: "Dein erster Wochenplan",
    postPayCoachBody:
      "Scanne deinen Kühlschrank und wir erstellen einen 7-Tage-Wochenplan mit Einkaufsliste — passend zu deinen Makros.",
    scanNow: "Jetzt scannen",
    laterBtn: "Später",
    ariaOpenBadges: "Badge-Seite öffnen",
    aiChatbotTitle: "KI-Chatbot",

    settingsSubscriptionGroup: "Abo",
    settingsOpeningPortal: "Wird geöffnet…",
    settingsAccountGroup: "Konto",
    settingsCommunity: "Community",
    settingsRestartOnboarding: "Onboarding erneut starten",
    deleteAccountConfirmTitle: "Konto permanent löschen?",
    deleteAccountConfirmDesc: "Diese Aktion kann nicht rückgängig gemacht werden.",

    recipesAlmostDone: "Fast geschafft!",
    recipesClarificationTitle: "Noch nicht ganz...",
    recipesClarificationDesc: "Ein paar Zutaten fehlen noch.",
    scanAgain: "Nochmal scannen",
    yourDish: "Dein Gericht",
    budgetAfterMeal: "Nach dieser Mahlzeit übrig:",

    createWeeklyPlan: "Wochenplan erstellen",
    mealPlanShoppingHint:
      "Erstelle einen Frigy Plan — die Einkaufsliste wird automatisch gefüllt.",
    toastMealAddFailed: "Mahlzeit konnte nicht hinzugefügt werden",
    toastMealSaveFailed: "Konnte Mahlzeit nicht speichern",

    toastEnterWeight: "Bitte gib dein Gewicht ein",
    toastWeightRange: "Gewicht muss zwischen 20 kg und 300 kg liegen",
    noWeightLoggedYet: "Noch kein Gewicht eingetragen",
    ariaEditCurrentWeight: "Aktuelles Gewicht bearbeiten",
    weightInputPlaceholder: "z.B. 75.5",

    toastNotificationsEnabled: "Benachrichtigungen aktiviert ✓",
    toastNotificationsDenied:
      "Berechtigung abgelehnt. Aktiviere Benachrichtigungen in den Geräteeinstellungen.",
    notificationsDisabledTitle: "Benachrichtigungen deaktiviert",
    notificationsDisabledDesc:
      "Aktiviere Benachrichtigungen, um Erinnerungen zu erhalten.",
    enableNotifications: "Aktivieren",
    reminderWaterLabel: "Wasser-Erinnerung",
    reminderMealsLabel: "Mahlzeiten-Erinnerung",
    reminderWeighLabel: "Wiege-Erinnerung",

    addMealWhatEating: "Was isst du?",
    addMealScan: "Mahlzeit scannen",
    addMealManual: "Manuell hinzufügen",
    addMealSearch: "Suchen",

    adminNoAccessTitle: "Kein Zugriff",
    adminNoAccessDesc: "Du hast keine Admin-Berechtigung.",
    adminBackToApp: "Zurück zur App",
    adminPanelTitle: "Admin Panel",
    adminGrantPremiumTitle: "Premium verschenken",
    adminGrantPremiumDesc: "Gib Influencern kostenloses Premium",
    adminUserEmailLabel: "E-Mail des Nutzers",
    adminEmailPlaceholder: "influencer@example.com",
    adminDurationLabel: "Dauer (Tage)",
    adminDurationOneYear: "1 Jahr",
    adminReasonLabel: "Grund (optional)",
    adminReasonPlaceholder: "z.B. Instagram Kooperation",
    toastEnterEmail: "Bitte E-Mail eingeben",
    adminGrantPremiumButton: "Premium gewähren",
    adminPremiumGranted: "Premium gewährt!",
    adminPremiumGrantFailed: "Premium konnte nicht gewährt werden",
    adminGranting: "Wird gewährt...",

    shareRecipeTitle: "Rezept teilen",
    recipeTitlePlaceholder: "z.B. Hähnchen-Avocado-Salat",
    recipeDescPlaceholder: "Beschreibe dein Rezept...",
    toastLoginRequired: "Bitte melde dich an",
    toastTitleRequired: "Titel ist erforderlich",
    toastRecipeShared: "Rezept geteilt!",
    toastRecipeShareFailed: "Rezept konnte nicht geteilt werden",

    healthSyncTitle: "Health Sync",
    healthSyncWeightPlaceholder: "Gewicht in kg",

    orderIngredientsBtn: "Zutaten bestellen",
    shareRecipeBtn: "Teilen",
    addToTrackerBtn: "Zum Tracker",

    onboardingWelcomeHeadline1: "Iss smarter.",
    onboardingWelcomeHeadline2: "Leb leichter.",
    onboardingWelcomeSubline: "Generiere Wochenpläne aus dem, was du hast.",
    onboardingGetStarted: "Loslegen",
    onboardingCommunityStepTitle: "Gemeinsam kochen",
    onboardingCommunityStepDesc: "Entdecke Rezepte aus der Community",
    ariaBack: "Zurück",

    toastCameraPermission: "Bitte Kamera in den Geräteeinstellungen erlauben.",
    loadingStripePortal: "Stripe wird geladen…",

    recipeHealthierAlternatives: "Gesündere Alternativen",
    recipePrepTimeMin: "Zubereitung",
    carbsMacroLabel: "Kohlenhydrate",
    fatMacroLabel: "Fett",
    postPayCoachBody2: "7-Tage-Wochenplan",
    postPayCoachBody3:
      "Frigy priorisiert deine vorhandenen Zutaten, ergänzt aber automatisch alles, was für deine Makroziele fehlt.",
    postPayCoachScanLine:
      "Scanne deinen Kühlschrank – Frigy erkennt deine Zutaten und erstellt daraus einen",
    postPayCoachShoppingLine:
      "Die Einkaufsliste entsteht automatisch aus dem Wochenplan als Lücke: nur Zutaten, die dir noch fehlen.",
  },
  en: {
    toastPleaseLogin: "Please sign in",
    toastCopiedToClipboard: "Copied to clipboard!",
    frigyCommunityShareTitle: "Frigy Community",

    communityPageTitle: "Community",
    communityPageSubtitle: "Recipes, ideas & motivation",
    communityShareRecipe: "Share recipe",
    communityStatMembers: "Members",
    communityStatRecipes: "Recipes",
    communityStatSuccess: "Success rate",
    communityTabRecipes: "Recipes",
    communityTabPosts: "Posts",
    communityLoadingRecipes: "Loading recipes...",
    communityEmptyRecipesTitle: "No recipes yet",
    communityEmptyRecipesDesc: "Be the first to share a recipe!",
    communityFirstRecipeBtn: "Share first recipe",
    communityMoreIngredients: "more",
    timeAgoMinutes: "{n} min ago",
    timeAgoHours: "{n} h ago",
    timeAgoDays: "{n} days ago",

    landingHeroTitle: "Losing weight has never been easier",
    landingHeroSubtitle:
      "Scan your fridge, get personalized recipes and reach your goal weight with AI support.",
    landingStartFreeBtn: "Start for free",
    landingSignInBtn: "Sign in",
    landingPreviewScanned: "Fridge scanned",
    landingPreviewRecipesFound: "3 recipes found",
    landingFeaturesHeading: "Everything you need",
    landingFeaturesSubheading: "One app for your complete weight-loss success",
    landingPremiumHeading: "Start Premium",
    landingPremiumSubheading: "Premium features for your nutrition and progress",
    landingPopularBadge: "Popular",
    landingPremiumDiscover: "Discover Premium",
    landingTestimonialsHeading: "What others say",
    landingAppStoreHeading: "Coming to the App Store",
    landingAppStoreSubheading: "Available for iOS and Android",
    landingAppStoreSoon: "App Store (Soon)",
    landingPlayStoreSoon: "Play Store (Soon)",
    landingCtaHeading: "Ready for your transformation?",
    landingCtaSubheading: "Join thousands who have already reached their goal weight.",
    landingFooterRights: "© 2026 Frigy. All rights reserved.",
    landingFeatureScanTitle: "Scan your fridge",
    landingFeatureScanDesc: "Take a photo of your fridge and get matching recipes instantly.",
    landingFeatureCaloriesTitle: "Calorie tracking",
    landingFeatureCaloriesDesc: "Track calories and macros automatically with AI analysis.",
    landingFeatureWeightTitle: "Weight loss",
    landingFeatureWeightDesc: "Personalized plans for sustainable weight loss.",
    landingFeatureWaterTitle: "Water tracker",
    landingFeatureWaterDesc: "Stay hydrated with daily reminders.",
    landingFeatureCommunityTitle: "Community",
    landingFeatureCommunityDesc: "Share recipes and connect with others.",
    landingFeatureHealthTitle: "Health sync",
    landingFeatureHealthDesc: "Sync with Apple Health & Google Fit.",
    landingTestimonial1: "Finally an app that understands what's in my fridge!",
    landingTestimonial2: "Lost 12 kg in 3 months. The meal plans are perfect.",
    landingTestimonial3: "The community is super motivating!",
    landingPremiumFeature1: "Unlimited scans",
    landingPremiumFeature2: "AI chatbot",
    landingPremiumFeature3: "Weekly meal plans",
    landingPremiumFeature4: "Shopping lists",
    landingPremiumFeature5: "Macro tracking",
    landingPremiumFeature6: "Water tracker",
    landingPremiumFeature7: "Community access",
    landingPremiumFeature8: "Health sync",

    manualIngredientsTitle: "Enter",
    manualIngredientsHighlight: "ingredients",
    manualWhatAtHome: "What do you have at home?",
    manualIngredientPlaceholder: "e.g. tomatoes, chicken, yogurt...",
    manualAddOneIngredient: "Add at least one ingredient to get started",

    notFoundTitle: "404",
    notFoundMessage: "Page not found",
    notFoundBackHome: "Back to home",

    recipeIngredientsHeading: "Ingredients",
    recipeInstructionsHeading: "Instructions",
    recipeNutritionHeading: "Nutrition",
    recipeDifficultyLabel: "Difficulty",
    preparation: "Preparation",
    difficultyMedium: "Medium",

    regenerateWeeklyPlan: "Regenerate weekly plan",
    macroGoalsChangedToast:
      "Your macro goals were updated. Regenerate your weekly plan so meals match again.",
    ariaGenerateWeeklyPlan: "Generate weekly plan",
    toastRecipeAddFailed: "Could not add recipe",
    trackerPersonalMacroPlan: "Your personal macro plan",
    trackerSetupLaterHint: "You can change this anytime later.",
    ariaAnalyzingFood: "Analyzing food",

    postPayCoachTitle: "Your first weekly plan",
    postPayCoachBody:
      "Scan your fridge and we'll create a 7-day meal plan with a shopping list — matched to your macros.",
    scanNow: "Scan now",
    laterBtn: "Later",
    ariaOpenBadges: "Open badges page",
    aiChatbotTitle: "AI chatbot",

    settingsSubscriptionGroup: "Subscription",
    settingsOpeningPortal: "Opening…",
    settingsAccountGroup: "Account",
    settingsCommunity: "Community",
    settingsRestartOnboarding: "Restart onboarding",
    deleteAccountConfirmTitle: "Permanently delete account?",
    deleteAccountConfirmDesc: "This action cannot be undone.",

    recipesAlmostDone: "Almost done!",
    recipesClarificationTitle: "Not quite yet...",
    recipesClarificationDesc: "A few ingredients are still missing.",
    scanAgain: "Scan again",
    yourDish: "Your dish",
    budgetAfterMeal: "Remaining after this meal:",

    createWeeklyPlan: "Create weekly plan",
    mealPlanShoppingHint:
      "Create a Frigy plan — the shopping list fills automatically.",
    toastMealAddFailed: "Could not add meal",
    toastMealSaveFailed: "Could not save meal",

    toastEnterWeight: "Please enter your weight",
    toastWeightRange: "Weight must be between 20 kg and 300 kg",
    noWeightLoggedYet: "No weight logged yet",
    ariaEditCurrentWeight: "Edit current weight",
    weightInputPlaceholder: "e.g. 75.5",

    toastNotificationsEnabled: "Notifications enabled ✓",
    toastNotificationsDenied:
      "Permission denied. Enable notifications in device settings.",
    notificationsDisabledTitle: "Notifications disabled",
    notificationsDisabledDesc: "Enable notifications to receive reminders.",
    enableNotifications: "Enable",
    reminderWaterLabel: "Water reminder",
    reminderMealsLabel: "Meal reminder",
    reminderWeighLabel: "Weigh-in reminder",

    addMealWhatEating: "What are you eating?",
    addMealScan: "Scan meal",
    addMealManual: "Add manually",
    addMealSearch: "Search",

    adminNoAccessTitle: "No access",
    adminNoAccessDesc: "You don't have admin permission.",
    adminBackToApp: "Back to app",
    adminPanelTitle: "Admin panel",
    adminGrantPremiumTitle: "Grant Premium",
    adminGrantPremiumDesc: "Give influencers free Premium",
    adminUserEmailLabel: "User email",
    adminEmailPlaceholder: "influencer@example.com",
    adminDurationLabel: "Duration (days)",
    adminDurationOneYear: "1 year",
    adminReasonLabel: "Reason (optional)",
    adminReasonPlaceholder: "e.g. Instagram collaboration",
    toastEnterEmail: "Please enter email",
    adminGrantPremiumButton: "Grant Premium",
    adminPremiumGranted: "Premium granted!",
    adminPremiumGrantFailed: "Could not grant Premium",
    adminGranting: "Granting...",

    shareRecipeTitle: "Share recipe",
    recipeTitlePlaceholder: "e.g. Chicken avocado salad",
    recipeDescPlaceholder: "Describe your recipe...",
    toastLoginRequired: "Please sign in",
    toastTitleRequired: "Title is required",
    toastRecipeShared: "Recipe shared!",
    toastRecipeShareFailed: "Could not share recipe",

    healthSyncTitle: "Health sync",
    healthSyncWeightPlaceholder: "Weight in kg",

    orderIngredientsBtn: "Order ingredients",
    shareRecipeBtn: "Share",
    addToTrackerBtn: "Add to tracker",

    onboardingWelcomeHeadline1: "Eat smarter.",
    onboardingWelcomeHeadline2: "Live lighter.",
    onboardingWelcomeSubline: "Generate weekly plans from what you have.",
    onboardingGetStarted: "Get started",
    onboardingCommunityStepTitle: "Cook with others",
    onboardingCommunityStepDesc: "Discover recipes from the community",
    ariaBack: "Back",

    toastCameraPermission: "Please allow camera access in device settings.",
    loadingStripePortal: "Loading Stripe…",

    recipeHealthierAlternatives: "Healthier alternatives",
    recipePrepTimeMin: "Prep time",
    carbsMacroLabel: "Carbs",
    fatMacroLabel: "Fat",
    postPayCoachBody2: "7-day weekly plan",
    postPayCoachBody3:
      "Frigy prioritizes what you have and automatically adds anything missing for your macro goals.",
    postPayCoachScanLine:
      "Scan your fridge — Frigy detects your ingredients and creates a",
    postPayCoachShoppingLine:
      "The shopping list is built from your weekly plan — only ingredients you still need.",
  },
  fr: {
    toastPleaseLogin: "Veuillez vous connecter",
    toastCopiedToClipboard: "Copié dans le presse-papiers !",
    frigyCommunityShareTitle: "Communauté Frigy",

    communityPageTitle: "Communauté",
    communityPageSubtitle: "Recettes, idées & motivation",
    communityShareRecipe: "Partager une recette",
    communityStatMembers: "Membres",
    communityStatRecipes: "Recettes",
    communityStatSuccess: "Taux de réussite",
    communityTabRecipes: "Recettes",
    communityTabPosts: "Publications",
    communityLoadingRecipes: "Chargement des recettes...",
    communityEmptyRecipesTitle: "Pas encore de recettes",
    communityEmptyRecipesDesc: "Sois le premier à partager une recette !",
    communityFirstRecipeBtn: "Partager la première recette",
    communityMoreIngredients: "de plus",
    timeAgoMinutes: "il y a {n} min",
    timeAgoHours: "il y a {n} h",
    timeAgoDays: "il y a {n} jours",

    landingHeroTitle: "Perdre du poids n'a jamais été aussi simple",
    landingHeroSubtitle:
      "Scanne ton frigo, reçois des recettes personnalisées et atteins ton poids idéal avec l'IA.",
    landingStartFreeBtn: "Commencer gratuitement",
    landingSignInBtn: "Se connecter",
    landingPreviewScanned: "Frigo scanné",
    landingPreviewRecipesFound: "3 recettes trouvées",
    landingFeaturesHeading: "Tout ce dont tu as besoin",
    landingFeaturesSubheading: "Une app pour ta réussite minceur complète",
    landingPremiumHeading: "Passer à Premium",
    landingPremiumSubheading: "Fonctions Premium pour ta nutrition et tes progrès",
    landingPopularBadge: "Populaire",
    landingPremiumDiscover: "Découvrir Premium",
    landingTestimonialsHeading: "Ce qu'ils en disent",
    landingAppStoreHeading: "Bientôt sur l'App Store",
    landingAppStoreSubheading: "Disponible sur iOS et Android",
    landingAppStoreSoon: "App Store (Bientôt)",
    landingPlayStoreSoon: "Play Store (Bientôt)",
    landingCtaHeading: "Prêt pour ta transformation ?",
    landingCtaSubheading:
      "Rejoins des milliers de personnes qui ont déjà atteint leur poids idéal.",
    landingFooterRights: "© 2026 Frigy. Tous droits réservés.",
    landingFeatureScanTitle: "Scanner le frigo",
    landingFeatureScanDesc:
      "Photographie ton frigo et reçois des recettes adaptées instantanément.",
    landingFeatureCaloriesTitle: "Suivi des calories",
    landingFeatureCaloriesDesc:
      "Suis tes calories et macros automatiquement avec l'analyse IA.",
    landingFeatureWeightTitle: "Perte de poids",
    landingFeatureWeightDesc: "Plans personnalisés pour une perte durable.",
    landingFeatureWaterTitle: "Suivi d'eau",
    landingFeatureWaterDesc: "Reste hydraté avec des rappels quotidiens.",
    landingFeatureCommunityTitle: "Communauté",
    landingFeatureCommunityDesc: "Partage des recettes et connecte-toi aux autres.",
    landingFeatureHealthTitle: "Sync santé",
    landingFeatureHealthDesc: "Synchronise avec Apple Health & Google Fit.",
    landingTestimonial1: "Enfin une app qui comprend ce qu'il y a dans mon frigo !",
    landingTestimonial2: "12 kg en 3 mois. Les plans de repas sont parfaits.",
    landingTestimonial3: "La communauté est super motivante !",
    landingPremiumFeature1: "Scans illimités",
    landingPremiumFeature2: "Chatbot IA",
    landingPremiumFeature3: "Plans hebdomadaires",
    landingPremiumFeature4: "Listes de courses",
    landingPremiumFeature5: "Suivi des macros",
    landingPremiumFeature6: "Suivi d'eau",
    landingPremiumFeature7: "Accès communauté",
    landingPremiumFeature8: "Sync santé",

    manualIngredientsTitle: "Saisir les",
    manualIngredientsHighlight: "ingrédients",
    manualWhatAtHome: "Qu'as-tu à la maison ?",
    manualIngredientPlaceholder: "ex. tomates, poulet, yaourt...",
    manualAddOneIngredient: "Ajoute au moins un ingrédient pour commencer",

    notFoundTitle: "404",
    notFoundMessage: "Page introuvable",
    notFoundBackHome: "Retour à l'accueil",

    recipeIngredientsHeading: "Ingrédients",
    recipeInstructionsHeading: "Préparation",
    recipeNutritionHeading: "Valeurs nutritionnelles",
    recipeDifficultyLabel: "Difficulté",
    preparation: "Préparation",
    difficultyMedium: "Moyen",

    regenerateWeeklyPlan: "Régénérer le plan hebdo",
    macroGoalsChangedToast:
      "Tes objectifs macros ont été mis à jour. Régénère ton plan hebdo pour que les repas correspondent.",
    ariaGenerateWeeklyPlan: "Générer le plan hebdo",
    toastRecipeAddFailed: "Impossible d'ajouter la recette",
    trackerPersonalMacroPlan: "Ton plan macro personnel",
    trackerSetupLaterHint: "Tu pourras modifier cela plus tard.",
    ariaAnalyzingFood: "Analyse de l'aliment",

    postPayCoachTitle: "Ton premier plan hebdo",
    postPayCoachBody:
      "Scanne ton frigo et nous créerons un plan de 7 jours avec liste de courses — adapté à tes macros.",
    scanNow: "Scanner maintenant",
    laterBtn: "Plus tard",
    ariaOpenBadges: "Ouvrir la page des badges",
    aiChatbotTitle: "Chatbot IA",

    settingsSubscriptionGroup: "Abonnement",
    settingsOpeningPortal: "Ouverture…",
    settingsAccountGroup: "Compte",
    settingsCommunity: "Communauté",
    settingsRestartOnboarding: "Relancer l'onboarding",
    deleteAccountConfirmTitle: "Supprimer définitivement le compte ?",
    deleteAccountConfirmDesc: "Cette action est irréversible.",

    recipesAlmostDone: "Presque terminé !",
    recipesClarificationTitle: "Pas encore tout à fait...",
    recipesClarificationDesc: "Il manque encore quelques ingrédients.",
    scanAgain: "Scanner à nouveau",
    yourDish: "Ton plat",
    budgetAfterMeal: "Restant après ce repas :",

    createWeeklyPlan: "Créer un plan hebdo",
    mealPlanShoppingHint:
      "Crée un plan Frigy — la liste de courses se remplit automatiquement.",
    toastMealAddFailed: "Impossible d'ajouter le repas",
    toastMealSaveFailed: "Impossible d'enregistrer le repas",

    toastEnterWeight: "Veuillez entrer votre poids",
    toastWeightRange: "Le poids doit être entre 20 kg et 300 kg",
    noWeightLoggedYet: "Aucun poids enregistré",
    ariaEditCurrentWeight: "Modifier le poids actuel",
    weightInputPlaceholder: "ex. 75,5",

    toastNotificationsEnabled: "Notifications activées ✓",
    toastNotificationsDenied:
      "Permission refusée. Active les notifications dans les réglages.",
    notificationsDisabledTitle: "Notifications désactivées",
    notificationsDisabledDesc: "Active les notifications pour recevoir des rappels.",
    enableNotifications: "Activer",
    reminderWaterLabel: "Rappel eau",
    reminderMealsLabel: "Rappel repas",
    reminderWeighLabel: "Rappel pesée",

    addMealWhatEating: "Que manges-tu ?",
    addMealScan: "Scanner le repas",
    addMealManual: "Ajouter manuellement",
    addMealSearch: "Rechercher",

    adminNoAccessTitle: "Pas d'accès",
    adminNoAccessDesc: "Tu n'as pas les droits administrateur.",
    adminBackToApp: "Retour à l'app",
    adminPanelTitle: "Panneau admin",
    adminGrantPremiumTitle: "Offrir Premium",
    adminGrantPremiumDesc: "Offrir Premium gratuit aux influenceurs",
    adminUserEmailLabel: "E-mail de l'utilisateur",
    adminEmailPlaceholder: "influenceur@exemple.com",
    adminDurationLabel: "Durée (jours)",
    adminDurationOneYear: "1 an",
    adminReasonLabel: "Raison (optionnel)",
    adminReasonPlaceholder: "ex. collaboration Instagram",
    toastEnterEmail: "Veuillez entrer l'e-mail",
    adminGrantPremiumButton: "Accorder Premium",
    adminPremiumGranted: "Premium accordé !",
    adminPremiumGrantFailed: "Impossible d'accorder Premium",
    adminGranting: "En cours...",

    shareRecipeTitle: "Partager la recette",
    recipeTitlePlaceholder: "ex. Salade poulet-avocat",
    recipeDescPlaceholder: "Décris ta recette...",
    toastLoginRequired: "Veuillez vous connecter",
    toastTitleRequired: "Le titre est requis",
    toastRecipeShared: "Recette partagée !",
    toastRecipeShareFailed: "Impossible de partager la recette",

    healthSyncTitle: "Sync santé",
    healthSyncWeightPlaceholder: "Poids en kg",

    orderIngredientsBtn: "Commander les ingrédients",
    shareRecipeBtn: "Partager",
    addToTrackerBtn: "Ajouter au tracker",

    onboardingWelcomeHeadline1: "Mange plus malin.",
    onboardingWelcomeHeadline2: "Vis plus léger.",
    onboardingWelcomeSubline: "Génère des plans hebdo avec ce que tu as.",
    onboardingGetStarted: "Commencer",
    onboardingCommunityStepTitle: "Cuisiner ensemble",
    onboardingCommunityStepDesc: "Découvre des recettes de la communauté",
    ariaBack: "Retour",

    toastCameraPermission: "Veuillez autoriser la caméra dans les réglages.",
    loadingStripePortal: "Chargement de Stripe…",

    recipeHealthierAlternatives: "Alternatives plus saines",
    recipePrepTimeMin: "Préparation",
    carbsMacroLabel: "Glucides",
    fatMacroLabel: "Lipides",
    postPayCoachBody2: "plan hebdo de 7 jours",
    postPayCoachBody3:
      "Frigy priorise ce que tu as et complète automatiquement ce qui manque pour tes objectifs macros.",
  },
};

/** Replace `{n}` placeholders in translated strings. */
export function formatTranslation(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}
