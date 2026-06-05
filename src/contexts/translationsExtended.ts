import type { Language } from "./LanguageContext";

/** UI strings not yet in the main LanguageContext block — merged at runtime. */
export interface ExtendedTranslations {
  toastPleaseLogin: string;
  toastCopiedToClipboard: string;
  landingTestimonialAuthor: string;
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

  healthSyncTitle: string;
  healthSyncWeightPlaceholder: string;

  orderIngredientsBtn: string;
  shareRecipeBtn: string;
  addToTrackerBtn: string;

  onboardingWelcomeHeadline1: string;
  onboardingWelcomeHeadline2: string;
  onboardingWelcomeSubline: string;
  onboardingGetStarted: string;
  onboardingFirstWeeklyPlanTitle: string;
  onboardingFirstWeeklyPlanDesc: string;
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

  navHome: string;
  navPlanShort: string;
  navShoppingShort: string;
  ariaMainNavigation: string;

  scanAllIngredientsPresent: string;
  scanCameraDevHintOpen: string;
  scanCameraDevHintLocalhost: string;
  scanCameraDevHintOrGallery: string;
  scanCapturePhoto: string;
  scanCaptureSr: string;
  scanPhotosQueued: string;
  scanPhotoCounter: string;
  scanFileTooLarge: string;
  scanPhotoReadError: string;
  scanPhotoFailedContinue: string;
  scanPhotoTimeoutContinue: string;
  scanPhotosAnalyzedSummary: string;
  scanPhotosSkippedSuffix: string;

  barcodeUnknownProduct: string;
  barcodeProductRecognized: string;
  barcodeProductNotFound: string;
  barcodeFetchError: string;
  barcodeNoCameraSupport: string;
  barcodeNeedsHttps: string;
  barcodeScannerOpenFailed: string;
  barcodeScannerLoadFailed: string;
  barcodeCameraStartFailed: string;
  barcodeCameraDenied: string;
  barcodeCameraNotFound: string;
  barcodeCameraInUse: string;
  barcodeCameraHttpsRequired: string;
  barcodeCameraInitSlow: string;
  barcodeScanNewProduct: string;
  barcodeHoldInFrame: string;
  barcodeLoadingProduct: string;
  ariaCloseScanner: string;
  barcodeBrandLabel: string;
  barcodeCaloriesLabel: string;
  barcodeCarbsLabel: string;
  barcodeFatLabel: string;
  barcodeProteinLabel: string;

  scanResultGeneratePlan: string;
  scanResultGeneratePlanDesc: string;
  scanResultGeneratingPlan: string;
  scanResultNewPhoto: string;
  scanResultRetryScan: string;

  premiumActivating: string;
  premiumActivatingDesc: string;
  premiumNotActiveYet: string;
  premiumNotActiveDesc: string;
  defaultMealName: string;

  onboardingStepCounter: string;
  trackerMealsPerDayTitle: string;
  trackerMealsPerDaySubtitle: string;
  trackerMealsUnit: string;
  trackerPaceSlow: string;
  trackerPaceModerate: string;
  trackerPaceFast: string;
  trackerPaceVeryFast: string;
  dailyOverviewTitle: string;
  dailyOverviewGoalsBadge: string;
  dailyOverviewMealsLogged: string;
  dailyOverviewRemainingCalories: string;
  dailyOverviewCalorieGoalReached: string;
  dailyOverviewOfKcal: string;
  dailyOverviewOfLiters: string;
  macroEditCarbsCalculated: string;
  macroEditCarbsCalculatedDesc: string;
  macroEditInvalidValue: string;
  macroEditCaloriesRange: string;
  macroEditMacroMismatchWarning: string;
  macroEditMacroMismatchDesc: string;
  macroEditGoalsSaved: string;
  macroEditGoalsSavedDesc: string;
  macroEditAutoCarbs: string;
  macroEditCaloriesLabel: string;
  profileDeleting: string;
  profileDeleteBtn: string;

  motivationTitle: string;
  motivationSubtitle: string;
  motivationHealthLabel: string;
  motivationHealthDesc: string;
  motivationConfidenceLabel: string;
  motivationConfidenceDesc: string;
  motivationEventLabel: string;
  motivationEventDesc: string;
  motivationDoctorLabel: string;
  motivationDoctorDesc: string;
  motivationFitnessLabel: string;
  motivationFitnessDesc: string;
  motivationHabitLabel: string;
  motivationHabitDesc: string;
  cookingTimeTitle: string;
  cookingTimeSubtitle: string;
  cookingTimeChangeLaterHint: string;
  cookingTime15Label: string;
  cookingTime15Desc: string;
  cookingTime30Label: string;
  cookingTime30Desc: string;
  cookingTime45Label: string;
  cookingTime45Desc: string;
  onboardingNonBinaryLabel: string;
  onboardingGenderQuestionTitle: string;
  onboardingDataDeletedAfterPlan: string;
  onboardingMinAgeNotice: string;
  aiDisclaimerShort: string;
  accountDeletedTitle: string;
  accountDeletedDesc: string;
  userNotAuthenticated: string;
  purchasesRestoredMsg: string;
  chatDarkModeOnTitle: string;
  chatDarkModeOnDesc: string;
  chatDarkModeOffTitle: string;
  chatDarkModeOffDesc: string;
  chatRegeneratePlanTitle: string;
  chatRegeneratePlanDesc: string;
  closeAiChatAria: string;
  paywallSignOut: string;
  onboardingHowTallTitle: string;
  onboardingCurrentWeightTitle: string;
  onboardingBirthdateTitle: string;
  onboardingBirthdateFormat: string;
  onboardingBirthdateError: string;
  onboardingBirthdateTooYoung: string;
  onboardingUnitMetric: string;
  onboardingUnitImperial: string;
  onboardingHeightHelperMetric: string;
  onboardingHeightHelperImperial: string;
  onboardingHeightErrorMetric: string;
  onboardingHeightErrorImperial: string;
  onboardingWeightHelperMetric: string;
  onboardingWeightHelperImperial: string;
  onboardingWeightErrorMetric: string;
  onboardingWeightErrorImperial: string;
  onboardingTargetWeightLoseTitle: string;
  onboardingTargetWeightGainTitle: string;
  onboardingTargetWeightMaintainTitle: string;
  onboardingTargetWeightFallbackTitle: string;
  onboardingTargetWeightSetGoal: string;
  onboardingTargetWeightHelperMetric: string;
  onboardingTargetWeightHelperImperial: string;
  onboardingTargetWeightErrorMetric: string;
  onboardingTargetWeightErrorImperial: string;
  authLoginFailed: string;
  authSignInIncomplete: string;
  authPasswordMinLength: string;
  authInvalidEmail: string;
  authSignupFailed: string;
  premiumCheckoutHint: string;
  premiumTrialHint: string;
  premiumViewPlansBtn: string;
  choosePlanTitle: string;
  healthSyncStepsLogged: string;
  onboardingUnitAriaLabel: string;
  onboardingHelloPrefix: string;
  onboardingHelloDefaultName: string;
  calorieDeficitLabel: string;
  calorieSurplusLabel: string;
  youWillReachSuffix: string;
  macroEditProteinAria: string;
  macroEditCarbsAria: string;
  macroEditFatAria: string;
  scanLaterShort: string;
  scanFeedbackNotEnough: string;
  scanFeedbackWrongItems: string;
  scanFeedbackTooSlow: string;
  scanFeedbackOther: string;
  scanFeedbackTitle: string;
  scanFeedbackSubtitle: string;
  scanFeedbackYes: string;
  scanFeedbackNo: string;
  scanFeedbackThanks: string;
  scanFeedbackIssueTitle: string;
  scanFeedbackDidntScan: string;
  onboardingCookingStyleTitle: string;
  onboardingCookingStyleSubtitle: string;
  onboardingSpontaneousLabel: string;
  onboardingSpontaneousDesc: string;
  onboardingStructuredLabel: string;
  onboardingStructuredDesc: string;
  onboardingSpontaneousModeTitle: string;
  onboardingScanFridgeIntroTitle: string;
  onboardingScanFridgeIntroSubtitle: string;
  onboardingScanFeaturePhoto: string;
  onboardingScanFeatureAi: string;
  onboardingScanFeatureRecipes: string;
  onboardingCameraRequiredHint: string;
  onboardingScanNowBtn: string;
  onboardingScanLaterBtn: string;
  onboardingStep2of2: string;
  onboardingMoodTitle: string;
  onboardingMoodSubtitle: string;
  onboardingMoodTiredLabel: string;
  onboardingMoodTiredDesc: string;
  onboardingMoodNormalLabel: string;
  onboardingMoodNormalDesc: string;
  onboardingMoodMotivatedLabel: string;
  onboardingMoodMotivatedDesc: string;
  onboardingMoodRecipesHint: string;
  onboardingGotIt: string;
  onboardingStep1of3: string;
  onboardingStep2of3: string;
  onboardingStep3of3: string;
  onboardingWeeklyPlanIntroTitle: string;
  onboardingWeeklyPlanIntroSubtitle: string;
  onboardingWeeklyPlanFeature1: string;
  onboardingWeeklyPlanFeature2: string;
  onboardingWeeklyPlanFeature3: string;
  onboardingShoppingIntroTitle: string;
  onboardingShoppingIntroSubtitle: string;
  onboardingShoppingFeature1: string;
  onboardingShoppingFeature2: string;
  onboardingShoppingFeature3: string;
  onboardingCycleTitle: string;
  onboardingCycleSubtitle: string;
  onboardingCycleLabelScan: string;
  onboardingCycleLabelPlan: string;
  onboardingCycleLabelShop: string;
  onboardingCycleEveryWeek: string;
  onboardingCycleFridgeUpdateHint: string;
  onboardingGenderNotebookQuestion: string;
  profileNutritionSection: string;
  badgeUnlockedToast: string;

  dashboardWaterEmpty: string;
  dashboardAddMealLabel: string;
  dashboardAddMealTitle: string;
  dashboardScanMealTitle: string;
  dashboardScanMealSubtitle: string;
  dashboardManualMealTitle: string;
  dashboardManualMealSubtitle: string;
  dashboardGenerateRecipeTitle: string;
  dashboardGenerateRecipeSubtitle: string;
  dashboardShoppingWidgetLabel: string;
  dashboardShoppingEmpty: string;
  dashboardShoppingAllDone: string;
  dashboardShoppingOpenCount: string;
  dashboardShoppingOpen: string;
  dashboardShoppingNoIngredients: string;
  dashboardShoppingHint: string;
  dashboardWeeklyPlanNextLabel: string;
  dashboardWeeklyPlanNextFallback: string;
  dashboardWeeklyPlanHint: string;
  dashboardWeeklyPlanCta: string;
  dashboardWeeklyPlanCtaEmpty: string;
  dashboardNoPlanEntry: string;
  dashboardTrackerOverGoal: string;
  dashboardTrackerRemaining: string;
  dashboardQuickLog: string;
  dashboardAddMealBtn: string;
  dashboardMealsTitle: string;
  dashboardMealSlotsSubtitle: string;
  dashboardFindThreeMeals: string;
  dashboardAiAdvisorLabel: string;
  dashboardAiAskTitle: string;
  dashboardAiPlaceholder: string;
  dashboardAiInputAria: string;
  dashboardAiSubmitAria: string;
  dashboardStepsTitle: string;
  dashboardStepsHint: string;
  dashboardStepsSyncing: string;
  dashboardStepsSync: string;
  dashboardStepsMobileOnly: string;
  dashboardStepsOpenInApp: string;
  shoppingListOfflineMode: string;
  shoppingListStillNeeded: string;
  shoppingListShowAll: string;
  shoppingListCollapseAll: string;
  shoppingListSaveOffline: string;
  shoppingListLastSaved: string;
  shoppingListCacheLoaded: string;
  shoppingListOfflineSavedTitle: string;
  shoppingListOfflineSavedDesc: string;
  shoppingListOfflineToastTitle: string;
  shoppingListOfflineToastDesc: string;
  shoppingListOfCount: string;
  shoppingListNotGenerated: string;
  shoppingListDayCount: string;
  shoppingCategoryFruitVeg: string;
  shoppingCategoryMeatFish: string;
  shoppingCategoryDairy: string;
  shoppingCategoryBreadGrains: string;
  shoppingCategoryPantry: string;
  shoppingCategoryOther: string;
  mealPlanPremiumActivatingTitle: string;
  mealPlanPremiumActivatingDesc: string;
  mealPlanDetectIngredients: string;
  mealPlanCreating: string;
  mealPlanCreateShort: string;
  mealPlanMealAddedDesc: string;
  ingredientDefaultName: string;
  dietBalanced: string;
  dietVegan: string;
  dietVegetarian: string;
  dietKeto: string;
  dietLowCarb: string;
  dietPaleo: string;
  dietPreferencesTitle: string;
  dietPreferencesSubtitle: string;
  dietPreferencesSavedTitle: string;
  dietPreferencesSavedDesc: string;
}

export const extendedTranslations: Record<Language, ExtendedTranslations> = {
  de: {
    toastPleaseLogin: "Bitte einloggen",
    toastCopiedToClipboard: "In Zwischenablage kopiert!",
    landingTestimonialAuthor: "Frigy-Nutzer",
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
    landingFeatureHealthTitle: "Wöchentliche Meal Plans",
    landingFeatureHealthDesc: "KI-generierte Wochenpläne passend zu deinen Zielen und Zutaten.",
    landingTestimonial1: "Endlich eine App, die versteht was ich im Kühlschrank habe!",
    landingTestimonial2: "Die Wochenpläne passen gut zu meinen Makros und sparen Zeit beim Einkaufen.",
    landingTestimonial3: "Die App ist übersichtlich und motiviert mich täglich.",
    landingPremiumFeature1: "Unbegrenzte Scans",
    landingPremiumFeature2: "KI-Chatbot",
    landingPremiumFeature3: "Wöchentliche Meal Plans",
    landingPremiumFeature4: "Einkaufslisten",
    landingPremiumFeature5: "Makro-Tracking",
    landingPremiumFeature6: "Wasser-Tracker",
    landingPremiumFeature7: "Fortschritt & Abzeichen",
    landingPremiumFeature8: "Personalisierte Ernährungsziele",

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

    healthSyncTitle: "Gewicht tracken",
    healthSyncWeightPlaceholder: "Gewicht in kg",

    orderIngredientsBtn: "Zutaten bestellen",
    shareRecipeBtn: "Teilen",
    addToTrackerBtn: "Zum Tracker",

    onboardingWelcomeHeadline1: "Iss smarter.",
    onboardingWelcomeHeadline2: "Leb leichter.",
    onboardingWelcomeSubline: "Generiere Wochenpläne, scanne deinen Kühlschrank und bekomme automatisch deine Einkaufsliste.",
    onboardingGetStarted: "Loslegen",
    onboardingFirstWeeklyPlanTitle: "Erstelle deinen ersten Frigy-Wochenplan!",
    onboardingFirstWeeklyPlanDesc:
      "Frigy plant deine Woche passend zu deinen Makrozielen — inklusive Einkaufsliste.",
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

    navHome: "Start",
    navPlanShort: "Plan",
    navShoppingShort: "Einkauf",
    ariaMainNavigation: "Hauptnavigation",

    scanAllIngredientsPresent: "Alles vorhanden – nichts fehlt.",
    scanCameraDevHintOpen: "Öffne die App mit ",
    scanCameraDevHintLocalhost: " unter ",
    scanCameraDevHintOrGallery: " — oder Galerie unten.",
    scanCapturePhoto: "Foto aufnehmen",
    scanCaptureSr: "Aufnahme",
    scanPhotosQueued: "{count} Foto(s)",
    scanPhotoCounter: "Foto {current} von {total}",
    scanFileTooLarge: "Datei zu groß",
    scanPhotoReadError: "Foto konnte nicht gelesen werden.",
    scanPhotoFailedContinue: "Foto {n} fehlgeschlagen. Weiter mit nächstem Foto…",
    scanPhotoTimeoutContinue: "Foto {n} hat zu lange gedauert. Weiter mit nächstem Foto…",
    scanPhotosAnalyzedSummary: "{analyzed} von {total} Foto(s) analysiert",
    scanPhotosSkippedSuffix: " ({skipped} übersprungen)",

    barcodeUnknownProduct: "Unbekanntes Produkt",
    barcodeProductRecognized: "Produkt erkannt!",
    barcodeProductNotFound: "Produkt nicht gefunden",
    barcodeFetchError: "Fehler beim Abrufen der Produktdaten",
    barcodeNoCameraSupport: "Dein Browser unterstützt keinen Kamera-Zugriff",
    barcodeNeedsHttps: "Kamera braucht HTTPS. Öffne die App über localhost, HTTPS oder als installierte App.",
    barcodeScannerOpenFailed: "Scanner konnte nicht geöffnet werden",
    barcodeScannerLoadFailed: "Barcode-Scanner konnte nicht geladen werden",
    barcodeCameraStartFailed: "Kamera konnte nicht gestartet werden",
    barcodeCameraDenied: "Kamera-Zugriff verweigert!",
    barcodeCameraNotFound: "Keine Kamera gefunden!",
    barcodeCameraInUse: "Kamera wird bereits verwendet!",
    barcodeCameraHttpsRequired: "Kamera braucht HTTPS oder localhost",
    barcodeCameraInitSlow: "Kamera-Initialisierung zu langsam",
    barcodeScanNewProduct: "Neues Produkt scannen",
    barcodeHoldInFrame: "Barcode in den Rahmen halten",
    barcodeLoadingProduct: "Produkt wird geladen…",
    ariaCloseScanner: "Scanner schließen",
    barcodeBrandLabel: "Marke:",
    barcodeCaloriesLabel: "Kalorien:",
    barcodeCarbsLabel: "Kohlenhydrate:",
    barcodeFatLabel: "Fett:",
    barcodeProteinLabel: "Protein:",

    scanResultGeneratePlan: "Wochenplan generieren",
    scanResultGeneratePlanDesc: "Aus deinen analysierten Zutaten und Makrozielen.",
    scanResultGeneratingPlan: "Erstelle deinen persönlichen Wochenplan…",
    scanResultNewPhoto: "Neues Foto",
    scanResultRetryScan: "Scan wiederholen oder Bild mit besserem Winkel aufnehmen.",

    premiumActivating: "Premium wird aktiviert…",
    premiumActivatingDesc: "Einen Moment – wir verbinden deine Zahlung mit deinem Konto.",
    premiumNotActiveYet: "Premium noch nicht aktiv",
    premiumNotActiveDesc:
      "Die Zahlung wurde empfangen, Premium ist aber noch nicht freigeschaltet. Bitte App neu öffnen oder in ein paar Minuten erneut prüfen.",
    defaultMealName: "Mahlzeit",

    onboardingStepCounter: "Schritt {current} von {total}",
    trackerMealsPerDayTitle: "Mahlzeiten pro Tag",
    trackerMealsPerDaySubtitle: "Wie viele Mahlzeiten möchtest du täglich haben?",
    trackerMealsUnit: "Mahlzeiten",
    trackerPaceSlow: "Langsam & Nachhaltig",
    trackerPaceModerate: "Moderat",
    trackerPaceFast: "Schnell",
    trackerPaceVeryFast: "Sehr Schnell",
    dailyOverviewTitle: "Tagesübersicht",
    dailyOverviewGoalsBadge: "{count}/3 Ziele",
    dailyOverviewMealsLogged: "eingetragen",
    dailyOverviewRemainingCalories: "Noch {calories} kcal übrig für heute",
    dailyOverviewCalorieGoalReached: "Kalorienziel erreicht!",
    dailyOverviewOfKcal: "von {target} kcal",
    dailyOverviewOfLiters: "von {target}L",
    macroEditCarbsCalculated: "Kohlenhydrate berechnet",
    macroEditCarbsCalculatedDesc: "Kohlenhydrate auf {carbs}g eingestellt, um {calories} kcal zu erreichen.",
    macroEditInvalidValue: "Ungültiger Wert",
    macroEditCaloriesRange: "Kalorien müssen zwischen 800 und 10000 liegen",
    macroEditMacroMismatchWarning: "Warnung",
    macroEditMacroMismatchDesc: "Protein und Fett sind zusammen zu hoch für dein Kalorienziel. Bitte senke einen der Werte oder erhöhe die Kalorien.",
    macroEditGoalsSaved: "Ziele gespeichert!",
    macroEditGoalsSavedDesc: "Deine neuen Makroziele wurden übernommen.",
    macroEditAutoCarbs: "Auto-KH",
    macroEditCaloriesLabel: "Kalorien",
    profileDeleting: "Wird gelöscht…",
    profileDeleteBtn: "Löschen",

    motivationTitle: "Was motiviert dich?",
    motivationSubtitle: "Wähle deinen Hauptgrund",
    motivationHealthLabel: "Gesünder leben",
    motivationHealthDesc: "Mehr Energie im Alltag",
    motivationConfidenceLabel: "Selbstbewusster fühlen",
    motivationConfidenceDesc: "Wohler im eigenen Körper",
    motivationEventLabel: "Für ein Event",
    motivationEventDesc: "Hochzeit, Urlaub, etc.",
    motivationDoctorLabel: "Gesundheit im Fokus",
    motivationDoctorDesc: "Persönliche Gesundheitsziele",
    motivationFitnessLabel: "Fitness verbessern",
    motivationFitnessDesc: "Sportliche Ziele",
    motivationHabitLabel: "Bessere Gewohnheiten",
    motivationHabitDesc: "Langfristige Änderung",
    cookingTimeTitle: "Wie viel Zeit zum Kochen?",
    cookingTimeSubtitle: "Für passende Rezeptvorschläge",
    cookingTimeChangeLaterHint: "Du kannst dies später in den Einstellungen ändern",
    cookingTime15Label: "15 Minuten",
    cookingTime15Desc: "Schnelle Gerichte",
    cookingTime30Label: "30 Minuten",
    cookingTime30Desc: "Normale Rezepte",
    cookingTime45Label: "45+ Minuten",
    cookingTime45Desc: "Aufwendige Küche",
    onboardingNonBinaryLabel: "Nicht-binär",
    onboardingGenderQuestionTitle: "Was ist dein Geschlecht?",
    onboardingDataDeletedAfterPlan: "Keine medizinische Beratung — KI-Schätzungen können ungenau sein.",
    onboardingMinAgeNotice: "Mindestalter: 9 Jahre. Frigy ersetzt keine ärztliche Beratung.",
    aiDisclaimerShort:
      "KI-generierte Schätzungen — keine medizinische Beratung. Allergene immer am Produktetikett prüfen.",
    accountDeletedTitle: "Konto gelöscht",
    accountDeletedDesc: "Dein Konto wurde erfolgreich gelöscht.",
    userNotAuthenticated: "Benutzer nicht authentifiziert",
    purchasesRestoredMsg: "Käufe wiederhergestellt.",
    chatDarkModeOnTitle: "Dark Mode aktiviert",
    chatDarkModeOnDesc: "Deine App ist jetzt im dunklen Modus.",
    chatDarkModeOffTitle: "Light Mode aktiviert",
    chatDarkModeOffDesc: "Deine App ist jetzt im hellen Modus.",
    chatRegeneratePlanTitle: "Neuer Wochenplan",
    chatRegeneratePlanDesc: "Dein Wochenplan wird generiert.",
    closeAiChatAria: "KI-Chat schließen",
    paywallSignOut: "Abmelden und anderes Konto nutzen",
    onboardingHowTallTitle: "Wie groß bist du?",
    onboardingCurrentWeightTitle: "Wie viel wiegst du aktuell?",
    onboardingBirthdateTitle: "Wann bist du geboren?",
    onboardingBirthdateFormat: "Format: TT.MM.JJJJ",
    onboardingBirthdateError: "Bitte gib ein gültiges Geburtsdatum ein.",
    onboardingBirthdateTooYoung: "Du musst mindestens 9 Jahre alt sein, um Frigy zu nutzen.",
    onboardingUnitMetric: "Metrisch",
    onboardingUnitImperial: "Imperial",
    onboardingHeightHelperMetric: "Zum Beispiel 170",
    onboardingHeightHelperImperial: "Zum Beispiel 5'7",
    onboardingHeightErrorMetric: "Bitte gib eine Größe zwischen 100 und 250 cm ein.",
    onboardingHeightErrorImperial: "Bitte gib eine Größe wie 5'7 ein.",
    onboardingWeightHelperMetric: "Zum Beispiel 70,0",
    onboardingWeightHelperImperial: "Zum Beispiel 154.3",
    onboardingWeightErrorMetric: "Bitte gib ein Gewicht zwischen 30,0 und 250,0 kg ein.",
    onboardingWeightErrorImperial: "Bitte gib ein Gewicht zwischen 66.0 und 550.0 lbs ein.",
    onboardingTargetWeightLoseTitle: "Was ist dein Zielgewicht?",
    onboardingTargetWeightGainTitle: "Was ist dein Wunschgewicht?",
    onboardingTargetWeightMaintainTitle: "Bestätige dein Zielgewicht",
    onboardingTargetWeightFallbackTitle: "Was ist dein Zielgewicht?",
    onboardingTargetWeightSetGoal: "Ziel festlegen",
    onboardingTargetWeightHelperMetric: "Zum Beispiel 65,0",
    onboardingTargetWeightHelperImperial: "Zum Beispiel 143.3",
    onboardingTargetWeightErrorMetric: "Bitte gib ein Zielgewicht zwischen 30,0 und 250,0 kg ein.",
    onboardingTargetWeightErrorImperial: "Bitte gib ein Zielgewicht zwischen 66.0 und 550.0 lbs ein.",
    authLoginFailed: "Login fehlgeschlagen",
    authSignInIncomplete: "Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen.",
    authPasswordMinLength: "Passwort muss mindestens 6 Zeichen lang sein",
    authInvalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein",
    authSignupFailed: "Registrierung fehlgeschlagen",
    premiumCheckoutHint: "Monatlich oder jährlich – Details beim Checkout",
    premiumTrialHint: "3 Tage kostenlos testen · danach €9,99/Monat",
    premiumViewPlansBtn: "Pläne ansehen",
    choosePlanTitle: "Wähle deinen Plan",
    healthSyncStepsLogged: "{count} Schritte",
    onboardingUnitAriaLabel: "Einheit",
    onboardingHelloPrefix: "Hallo",
    onboardingHelloDefaultName: "du",
    calorieDeficitLabel: "Kaloriendefizit",
    calorieSurplusLabel: "Kalorienüberschuss",
    youWillReachSuffix: "erreichen",
    macroEditProteinAria: "Protein anpassen",
    macroEditCarbsAria: "Kohlenhydrate anpassen",
    macroEditFatAria: "Fett anpassen",
    scanLaterShort: "Später scannen",
    scanFeedbackNotEnough: "Zu wenige Zutaten erkannt",
    scanFeedbackWrongItems: "Falsche Zutaten erkannt",
    scanFeedbackTooSlow: "Zu langsam",
    scanFeedbackOther: "Sonstiges",
    scanFeedbackTitle: "Hat der Scan gefallen?",
    scanFeedbackSubtitle: "Dein Feedback hilft uns besser zu werden",
    scanFeedbackYes: "Ja!",
    scanFeedbackNo: "Nein",
    scanFeedbackThanks: "Super, danke! 🎉",
    scanFeedbackIssueTitle: "Was war das Problem?",
    scanFeedbackDidntScan: "Ich habe nicht gescannt",
    onboardingCookingStyleTitle: "Wie möchtest du kochen?",
    onboardingCookingStyleSubtitle: "Wähle deinen Stil – du kannst ihn später ändern",
    onboardingSpontaneousLabel: "🎲 Spontan & Flexibel",
    onboardingSpontaneousDesc: "Scanne deinen Kühlschrank, wähle deine Stimmung – bekomme passende Rezepte",
    onboardingStructuredLabel: "📋 Strukturiert & Geplant",
    onboardingStructuredDesc: "Wochenplan der täglich deine Makros trifft + automatische Einkaufsliste",
    onboardingSpontaneousModeTitle: "Spontan-Modus",
    onboardingScanFridgeIntroTitle: "Kühlschrank scannen",
    onboardingScanFridgeIntroSubtitle: "Zeig uns was du hast – wir machen Rezepte draus",
    onboardingScanFeaturePhoto: "Mach ein Foto von deinem Kühlschrank",
    onboardingScanFeatureAi: "KI erkennt automatisch alle Zutaten",
    onboardingScanFeatureRecipes: "Bekomme 3 Rezepte basierend auf deiner Stimmung",
    onboardingCameraRequiredHint: "Wir benötigen Kamera-Zugriff für den Scan",
    onboardingScanNowBtn: "Jetzt scannen",
    onboardingScanLaterBtn: "Später scannen",
    onboardingStep2of2: "Schritt 2 von 2",
    onboardingMoodTitle: "Wie fühlst du dich?",
    onboardingMoodSubtitle: "Deine Stimmung bestimmt die Rezept-Komplexität",
    onboardingMoodTiredLabel: "Müde",
    onboardingMoodTiredDesc: "Super einfache 5-Minuten Rezepte",
    onboardingMoodNormalLabel: "Normal",
    onboardingMoodNormalDesc: "Ausgewogene 15-20 Minuten Gerichte",
    onboardingMoodMotivatedLabel: "Motiviert",
    onboardingMoodMotivatedDesc: "Anspruchsvollere Kreationen",
    onboardingMoodRecipesHint: "Du bekommst 3 personalisierte Rezepte basierend auf deinen Zutaten + Stimmung",
    onboardingGotIt: "Verstanden!",
    onboardingStep1of3: "Schritt 1 von 3",
    onboardingStep2of3: "Schritt 2 von 3",
    onboardingStep3of3: "Schritt 3 von 3",
    onboardingWeeklyPlanIntroTitle: "Dein Wochenplan",
    onboardingWeeklyPlanIntroSubtitle: "7 Tage perfekt auf deine Makros abgestimmt",
    onboardingWeeklyPlanFeature1: "Jeder Tag trifft exakt deine Kalorien & Makros",
    onboardingWeeklyPlanFeature2: "5 Mahlzeiten pro Tag – Frühstück bis Abendessen",
    onboardingWeeklyPlanFeature3: "Einzelne Mahlzeiten jederzeit austauschen",
    onboardingShoppingIntroTitle: "Automatische Einkaufsliste",
    onboardingShoppingIntroSubtitle: "Alles was du für die Woche brauchst",
    onboardingShoppingFeature1: "Liste wird aus Wochenplan generiert",
    onboardingShoppingFeature2: "Abhaken beim Einkaufen",
    onboardingShoppingFeature3: "Scan aktualisiert deine Liste automatisch",
    onboardingCycleTitle: "Der Kreislauf",
    onboardingCycleSubtitle: "Scan → Plan → Einkaufen → Wiederholen",
    onboardingCycleLabelScan: "Scannen",
    onboardingCycleLabelPlan: "Planen",
    onboardingCycleLabelShop: "Einkaufen",
    onboardingCycleEveryWeek: "Jede Woche neu",
    onboardingCycleFridgeUpdateHint: "Dein Kühlschrank-Scan aktualisiert automatisch was du noch brauchst",
    onboardingGenderNotebookQuestion: "WAS IST DEIN\nGESCHLECHT?",
    profileNutritionSection: "Ernährung",
    badgeUnlockedToast: "{icon} Neues Badge freigeschaltet!",

    dashboardWaterEmpty: "Noch durstig? Fang\nmit einem Glas\nWasser an",
    dashboardAddMealLabel: "Essen",
    dashboardAddMealTitle: "Was isst du?",
    dashboardScanMealTitle: "Meal scannen",
    dashboardScanMealSubtitle: "Kamera · schnell erfassen",
    dashboardManualMealTitle: "Manuell hinzufügen",
    dashboardManualMealSubtitle: "Tracker",
    dashboardGenerateRecipeTitle: "Rezept generieren",
    dashboardGenerateRecipeSubtitle: "KI · aus Vorrat",
    dashboardShoppingWidgetLabel: "Liste",
    dashboardShoppingEmpty: "Leer",
    dashboardShoppingAllDone: "Alles da",
    dashboardShoppingOpenCount: "{count} offen",
    dashboardShoppingOpen: "Öffnen",
    dashboardShoppingNoIngredients: "Noch keine Zutaten",
    dashboardShoppingHint: "Tippe Zutaten ab. Mehr im Tab Einkauf.",
    dashboardWeeklyPlanNextLabel: "Nächstes Essen",
    dashboardWeeklyPlanNextFallback: "Noch kein Plan",
    dashboardWeeklyPlanHint: "Erstelle deinen Wochenplan",
    dashboardWeeklyPlanCta: "Heute ansehen",
    dashboardWeeklyPlanCtaEmpty: "Zum Wochenplan",
    dashboardNoPlanEntry: "Kein Eintrag im Plan",
    dashboardTrackerOverGoal: "über dem Ziel",
    dashboardTrackerRemaining: "übrig",
    dashboardQuickLog: "Schnell eintragen",
    dashboardAddMealBtn: "Hinzufügen",
    dashboardMealsTitle: "Mahlzeiten",
    dashboardMealSlotsSubtitle: "Heute eintragen",
    dashboardFindThreeMeals: "3 Gerichte suchen",
    dashboardAiAdvisorLabel: "KI-Berater",
    dashboardAiAskTitle: "Frage stellen",
    dashboardAiPlaceholder: "Wie decke ich meine Proteine? ...",
    dashboardAiInputAria: "Frage an die KI",
    dashboardAiSubmitAria: "Senden und Chat öffnen",
    dashboardStepsTitle: "Schritte",
    dashboardStepsHint: "Wie wär's mit\neinem kurzen\nSpaziergang?",
    dashboardStepsSyncing: "Synchronisiere...",
    dashboardStepsSync: "Schritte syncen",
    dashboardStepsMobileOnly: "Schritte nur in der App erfassen",
    dashboardStepsOpenInApp: "In App öffnen",
    shoppingListOfflineMode: "Offline-Modus aktiv",
    shoppingListStillNeeded: "noch nötig",
    shoppingListShowAll: "Alle anzeigen",
    shoppingListCollapseAll: "Alle minimieren",
    shoppingListSaveOffline: "Für Offline speichern",
    shoppingListLastSaved: "Zuletzt gespeichert",
    shoppingListCacheLoaded: "Daten aus Cache geladen",
    shoppingListOfflineSavedTitle: "✅ Offline gespeichert!",
    shoppingListOfflineSavedDesc: "Einkaufsliste ist jetzt im Supermarkt ohne Internet verfügbar.",
    shoppingListOfflineToastTitle: "📴 Offline-Modus",
    shoppingListOfflineToastDesc: "Einkaufsliste ist weiterhin verfügbar!",
    shoppingListOfCount: "von",
    shoppingListNotGenerated: "Nicht generiert",
    shoppingListDayCount: "{count} Tage",
    shoppingCategoryFruitVeg: "Obst & Gemüse",
    shoppingCategoryMeatFish: "Fleisch & Fisch",
    shoppingCategoryDairy: "Milchprodukte",
    shoppingCategoryBreadGrains: "Brot & Getreide",
    shoppingCategoryPantry: "Pantry",
    shoppingCategoryOther: "Sonstiges",
    mealPlanPremiumActivatingTitle: "Premium wird aktiviert...",
    mealPlanPremiumActivatingDesc: "Bitte warte einen Moment, während wir dein Abo einrichten.",
    mealPlanDetectIngredients: "Zutaten erkennen",
    mealPlanCreating: "Erstellt...",
    mealPlanCreateShort: "Erstellen",
    mealPlanMealAddedDesc: "Mahlzeit zu deinem Tracker hinzugefügt",
    ingredientDefaultName: "Zutat",
    dietBalanced: "Ausgewogene Ernährung",
    dietVegan: "Vegan",
    dietVegetarian: "Vegetarisch",
    dietKeto: "Keto",
    dietLowCarb: "Kohlenhydratarm",
    dietPaleo: "Paleo",
    dietPreferencesTitle: "Ernährungsweise",
    dietPreferencesSubtitle: "Wird für Rezepte und Wochenplan verwendet",
    dietPreferencesSavedTitle: "Gespeichert",
    dietPreferencesSavedDesc: "Deine Ernährungsweise wurde aktualisiert.",
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
    communityEmptyPostsTitle: "No posts yet",
    communityEmptyPostsDesc: "Share your first recipe — posts will show up here as the community grows.",
    landingTestimonialAuthor: "Frigy user",
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
    landingFeatureHealthTitle: "Weekly meal plans",
    landingFeatureHealthDesc: "AI-generated weekly plans tailored to your goals and ingredients.",
    landingTestimonial1: "Finally an app that understands what's in my fridge!",
    landingTestimonial2: "Weekly plans match my macros and save time on grocery shopping.",
    landingTestimonial3: "The community is super motivating!",
    landingPremiumFeature1: "Unlimited scans",
    landingPremiumFeature2: "AI chatbot",
    landingPremiumFeature3: "Weekly meal plans",
    landingPremiumFeature4: "Shopping lists",
    landingPremiumFeature5: "Macro tracking",
    landingPremiumFeature6: "Water tracker",
    landingPremiumFeature7: "Progress & badges",
    landingPremiumFeature8: "Personalized nutrition goals",

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

    healthSyncTitle: "Track weight",
    healthSyncWeightPlaceholder: "Weight in kg",

    orderIngredientsBtn: "Order ingredients",
    shareRecipeBtn: "Share",
    addToTrackerBtn: "Add to tracker",

    onboardingWelcomeHeadline1: "Eat smarter.",
    onboardingWelcomeHeadline2: "Live lighter.",
    onboardingWelcomeSubline: "Generate weekly plans, scan your fridge and automatically get your shopping list.",
    onboardingGetStarted: "Get started",
    onboardingFirstWeeklyPlanTitle: "Create your first Frigy weekly plan!",
    onboardingFirstWeeklyPlanDesc: "Frigy plans your week to match your macro goals — including a shopping list.",
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

    navHome: "Home",
    navPlanShort: "Plan",
    navShoppingShort: "Shop",
    ariaMainNavigation: "Main navigation",

    scanAllIngredientsPresent: "Everything is available — nothing is missing.",
    scanCameraDevHintOpen: "Open the app with ",
    scanCameraDevHintLocalhost: " at ",
    scanCameraDevHintOrGallery: " — or use the gallery below.",
    scanCapturePhoto: "Take photo",
    scanCaptureSr: "Capture",
    scanPhotosQueued: "{count} photo(s)",
    scanPhotoCounter: "Photo {current} of {total}",
    scanFileTooLarge: "File too large",
    scanPhotoReadError: "Could not read photo.",
    scanPhotoFailedContinue: "Photo {n} failed. Continuing with next photo…",
    scanPhotoTimeoutContinue: "Photo {n} timed out. Continuing with next photo…",
    scanPhotosAnalyzedSummary: "{analyzed} of {total} photo(s) analyzed",
    scanPhotosSkippedSuffix: " ({skipped} skipped)",

    barcodeUnknownProduct: "Unknown product",
    barcodeProductRecognized: "Product recognized!",
    barcodeProductNotFound: "Product not found",
    barcodeFetchError: "Error fetching product data",
    barcodeNoCameraSupport: "Your browser does not support camera access",
    barcodeNeedsHttps: "Camera requires HTTPS. Open the app via localhost, HTTPS, or as an installed app.",
    barcodeScannerOpenFailed: "Could not open scanner",
    barcodeScannerLoadFailed: "Could not load barcode scanner",
    barcodeCameraStartFailed: "Could not start camera",
    barcodeCameraDenied: "Camera access denied!",
    barcodeCameraNotFound: "No camera found!",
    barcodeCameraInUse: "Camera is already in use!",
    barcodeCameraHttpsRequired: "Camera requires HTTPS or localhost",
    barcodeCameraInitSlow: "Camera initialization too slow",
    barcodeScanNewProduct: "Scan new product",
    barcodeHoldInFrame: "Hold barcode inside the frame",
    barcodeLoadingProduct: "Loading product…",
    ariaCloseScanner: "Close scanner",
    barcodeBrandLabel: "Brand:",
    barcodeCaloriesLabel: "Calories:",
    barcodeCarbsLabel: "Carbs:",
    barcodeFatLabel: "Fat:",
    barcodeProteinLabel: "Protein:",

    scanResultGeneratePlan: "Generate weekly plan",
    scanResultGeneratePlanDesc: "From your analyzed ingredients and macro goals.",
    scanResultGeneratingPlan: "Creating your personal weekly plan…",
    scanResultNewPhoto: "New photo",
    scanResultRetryScan: "Retry scan or take a photo from a better angle.",

    premiumActivating: "Activating Premium…",
    premiumActivatingDesc: "One moment — linking your payment to your account.",
    premiumNotActiveYet: "Premium not active yet",
    premiumNotActiveDesc:
      "Payment received, but Premium is not active yet. Reopen the app or try again in a few minutes.",
    defaultMealName: "Meal",

    onboardingStepCounter: "Step {current} of {total}",
    trackerMealsPerDayTitle: "Meals per day",
    trackerMealsPerDaySubtitle: "How many meals do you want each day?",
    trackerMealsUnit: "meals",
    trackerPaceSlow: "Slow & sustainable",
    trackerPaceModerate: "Moderate",
    trackerPaceFast: "Fast",
    trackerPaceVeryFast: "Very fast",
    dailyOverviewTitle: "Daily overview",
    dailyOverviewGoalsBadge: "{count}/3 goals",
    dailyOverviewMealsLogged: "logged",
    dailyOverviewRemainingCalories: "{calories} kcal left for today",
    dailyOverviewCalorieGoalReached: "Calorie goal reached!",
    dailyOverviewOfKcal: "of {target} kcal",
    dailyOverviewOfLiters: "of {target}L",
    macroEditCarbsCalculated: "Carbs calculated",
    macroEditCarbsCalculatedDesc: "Carbs set to {carbs}g to reach {calories} kcal.",
    macroEditInvalidValue: "Invalid value",
    macroEditCaloriesRange: "Calories must be between 800 and 10000",
    macroEditMacroMismatchWarning: "Warning",
    macroEditMacroMismatchDesc: "Protein and fat are too high for your calorie goal. Lower one or increase calories.",
    macroEditGoalsSaved: "Goals saved!",
    macroEditGoalsSavedDesc: "Your new macro goals have been applied.",
    macroEditAutoCarbs: "Auto carbs",
    macroEditCaloriesLabel: "Calories",
    profileDeleting: "Deleting…",
    profileDeleteBtn: "Delete",

    motivationTitle: "What motivates you?",
    motivationSubtitle: "Choose your main reason",
    motivationHealthLabel: "Live healthier",
    motivationHealthDesc: "More daily energy",
    motivationConfidenceLabel: "Feel more confident",
    motivationConfidenceDesc: "Comfortable in your body",
    motivationEventLabel: "For an event",
    motivationEventDesc: "Wedding, vacation, etc.",
    motivationDoctorLabel: "Health focus",
    motivationDoctorDesc: "Personal health goals",
    motivationFitnessLabel: "Improve fitness",
    motivationFitnessDesc: "Athletic goals",
    motivationHabitLabel: "Better habits",
    motivationHabitDesc: "Long-term change",
    cookingTimeTitle: "How much time to cook?",
    cookingTimeSubtitle: "For matching recipe suggestions",
    cookingTimeChangeLaterHint: "You can change this later in settings",
    cookingTime15Label: "15 minutes",
    cookingTime15Desc: "Quick meals",
    cookingTime30Label: "30 minutes",
    cookingTime30Desc: "Standard recipes",
    cookingTime45Label: "45+ minutes",
    cookingTime45Desc: "Elaborate cooking",
    onboardingNonBinaryLabel: "Non-binary",
    onboardingGenderQuestionTitle: "What is your gender?",
    onboardingDataDeletedAfterPlan: "Not medical advice — AI estimates may be inaccurate.",
    onboardingMinAgeNotice: "Minimum age: 9. Frigy does not replace medical advice.",
    aiDisclaimerShort:
      "AI-generated estimates — not medical advice. Always verify allergens on product labels.",
    accountDeletedTitle: "Account deleted",
    accountDeletedDesc: "Your account was deleted successfully.",
    userNotAuthenticated: "User not authenticated",
    purchasesRestoredMsg: "Purchases restored.",
    chatDarkModeOnTitle: "Dark mode enabled",
    chatDarkModeOnDesc: "The app is now in dark mode.",
    chatDarkModeOffTitle: "Light mode enabled",
    chatDarkModeOffDesc: "The app is now in light mode.",
    chatRegeneratePlanTitle: "New weekly plan",
    chatRegeneratePlanDesc: "Your weekly plan is being generated.",
    closeAiChatAria: "Close AI chat",
    paywallSignOut: "Sign out and use a different account",
    onboardingHowTallTitle: "How tall are you?",
    onboardingCurrentWeightTitle: "What's your current weight?",
    onboardingBirthdateTitle: "When were you born?",
    onboardingBirthdateFormat: "Format: DD.MM.YYYY",
    onboardingBirthdateError: "Enter a valid birth date.",
    onboardingBirthdateTooYoung: "You must be at least 9 years old to use Frigy.",
    onboardingUnitMetric: "Metric",
    onboardingUnitImperial: "Imperial",
    onboardingHeightHelperMetric: "For example 170",
    onboardingHeightHelperImperial: "For example 5'7",
    onboardingHeightErrorMetric: "Enter a height between 100 and 250 cm.",
    onboardingHeightErrorImperial: "Enter a height like 5'7.",
    onboardingWeightHelperMetric: "For example 70.0",
    onboardingWeightHelperImperial: "For example 154.3",
    onboardingWeightErrorMetric: "Enter a weight between 30.0 and 250.0 kg.",
    onboardingWeightErrorImperial: "Enter a weight between 66.0 and 550.0 lbs.",
    onboardingTargetWeightLoseTitle: "What's your target weight?",
    onboardingTargetWeightGainTitle: "What's your desired weight?",
    onboardingTargetWeightMaintainTitle: "Confirm your target weight",
    onboardingTargetWeightFallbackTitle: "What's your target weight?",
    onboardingTargetWeightSetGoal: "Set goal",
    onboardingTargetWeightHelperMetric: "For example 65.0",
    onboardingTargetWeightHelperImperial: "For example 143.3",
    onboardingTargetWeightErrorMetric: "Enter a target weight between 30.0 and 250.0 kg.",
    onboardingTargetWeightErrorImperial: "Enter a target weight between 66.0 and 550.0 lbs.",
    authLoginFailed: "Login failed",
    authSignInIncomplete: "Could not complete sign-in. Please try again.",
    authPasswordMinLength: "Password must be at least 6 characters",
    authInvalidEmail: "Please enter a valid email address",
    authSignupFailed: "Registration failed",
    premiumCheckoutHint: "Monthly or yearly – see checkout for details",
    premiumTrialHint: "3-day free trial · then €9.99/mo",
    premiumViewPlansBtn: "View plans",
    choosePlanTitle: "Choose your plan",
    healthSyncStepsLogged: "{count} steps",
    onboardingUnitAriaLabel: "Unit",
    onboardingHelloPrefix: "Hello",
    onboardingHelloDefaultName: "you",
    calorieDeficitLabel: "Calorie deficit",
    calorieSurplusLabel: "Calorie surplus",
    youWillReachSuffix: "",
    macroEditProteinAria: "Edit protein",
    macroEditCarbsAria: "Edit carbs",
    macroEditFatAria: "Edit fat",
    scanLaterShort: "Scan later",
    scanFeedbackNotEnough: "Too few ingredients detected",
    scanFeedbackWrongItems: "Wrong ingredients detected",
    scanFeedbackTooSlow: "Too slow",
    scanFeedbackOther: "Other",
    scanFeedbackTitle: "Did you like the scan?",
    scanFeedbackSubtitle: "Your feedback helps us improve",
    scanFeedbackYes: "Yes!",
    scanFeedbackNo: "No",
    scanFeedbackThanks: "Great, thanks! 🎉",
    scanFeedbackIssueTitle: "What was the issue?",
    scanFeedbackDidntScan: "I didn't scan",
    onboardingCookingStyleTitle: "How do you want to cook?",
    onboardingCookingStyleSubtitle: "Choose your style – you can change it later",
    onboardingSpontaneousLabel: "🎲 Spontaneous & Flexible",
    onboardingSpontaneousDesc: "Scan your fridge, choose your mood – get matching recipes",
    onboardingStructuredLabel: "📋 Structured & Planned",
    onboardingStructuredDesc: "Weekly plan that hits your daily macros + automatic shopping list",
    onboardingSpontaneousModeTitle: "Spontaneous Mode",
    onboardingScanFridgeIntroTitle: "Scan Your Fridge",
    onboardingScanFridgeIntroSubtitle: "Show us what you have – we'll make recipes from it",
    onboardingScanFeaturePhoto: "Take a photo of your fridge",
    onboardingScanFeatureAi: "AI automatically recognizes all ingredients",
    onboardingScanFeatureRecipes: "Get 3 recipes based on your mood",
    onboardingCameraRequiredHint: "We need camera access for scanning",
    onboardingScanNowBtn: "Scan Now",
    onboardingScanLaterBtn: "Scan Later",
    onboardingStep2of2: "Step 2 of 2",
    onboardingMoodTitle: "How are you feeling?",
    onboardingMoodSubtitle: "Your mood determines recipe complexity",
    onboardingMoodTiredLabel: "Tired",
    onboardingMoodTiredDesc: "Super simple 5-minute recipes",
    onboardingMoodNormalLabel: "Normal",
    onboardingMoodNormalDesc: "Balanced 15-20 minute dishes",
    onboardingMoodMotivatedLabel: "Motivated",
    onboardingMoodMotivatedDesc: "More challenging creations",
    onboardingMoodRecipesHint: "You get 3 personalized recipes based on your ingredients + mood",
    onboardingGotIt: "Got it!",
    onboardingStep1of3: "Step 1 of 3",
    onboardingStep2of3: "Step 2 of 3",
    onboardingStep3of3: "Step 3 of 3",
    onboardingWeeklyPlanIntroTitle: "Your Weekly Plan",
    onboardingWeeklyPlanIntroSubtitle: "7 days perfectly matched to your macros",
    onboardingWeeklyPlanFeature1: "Every day hits your exact calories & macros",
    onboardingWeeklyPlanFeature2: "5 meals per day – breakfast to dinner",
    onboardingWeeklyPlanFeature3: "Swap individual meals anytime",
    onboardingShoppingIntroTitle: "Automatic Shopping List",
    onboardingShoppingIntroSubtitle: "Everything you need for the week",
    onboardingShoppingFeature1: "List is generated from weekly plan",
    onboardingShoppingFeature2: "Check off while shopping",
    onboardingShoppingFeature3: "Scan automatically updates your list",
    onboardingCycleTitle: "The Cycle",
    onboardingCycleSubtitle: "Scan → Plan → Shop → Repeat",
    onboardingCycleLabelScan: "Scan",
    onboardingCycleLabelPlan: "Plan",
    onboardingCycleLabelShop: "Shop",
    onboardingCycleEveryWeek: "Every week",
    onboardingCycleFridgeUpdateHint: "Your fridge scan automatically updates what you still need",
    onboardingGenderNotebookQuestion: "WHAT'S YOUR\nGENDER?",
    profileNutritionSection: "Nutrition",
    badgeUnlockedToast: "{icon} New badge unlocked!",

    dashboardWaterEmpty: "Still thirsty?\nStart with\none glass of water",
    dashboardAddMealLabel: "Meals",
    dashboardAddMealTitle: "What are you eating?",
    dashboardScanMealTitle: "Scan meal",
    dashboardScanMealSubtitle: "Camera · quick capture",
    dashboardManualMealTitle: "Add manually",
    dashboardManualMealSubtitle: "Tracker",
    dashboardGenerateRecipeTitle: "Generate recipe",
    dashboardGenerateRecipeSubtitle: "AI · from your fridge",
    dashboardShoppingWidgetLabel: "List",
    dashboardShoppingEmpty: "Empty",
    dashboardShoppingAllDone: "All set",
    dashboardShoppingOpenCount: "{count} open",
    dashboardShoppingOpen: "Open",
    dashboardShoppingNoIngredients: "No ingredients yet",
    dashboardShoppingHint: "Check ingredients off here. More in the shopping tab.",
    dashboardWeeklyPlanNextLabel: "Next meal",
    dashboardWeeklyPlanNextFallback: "No plan yet",
    dashboardWeeklyPlanHint: "Create your weekly plan",
    dashboardWeeklyPlanCta: "View today",
    dashboardWeeklyPlanCtaEmpty: "Open plan",
    dashboardNoPlanEntry: "No entry in plan",
    dashboardTrackerOverGoal: "over goal",
    dashboardTrackerRemaining: "left",
    dashboardQuickLog: "Quick add",
    dashboardAddMealBtn: "Add",
    dashboardMealsTitle: "Meals",
    dashboardMealSlotsSubtitle: "Log today",
    dashboardFindThreeMeals: "Find 3 meals",
    dashboardAiAdvisorLabel: "AI advisor",
    dashboardAiAskTitle: "Ask a question",
    dashboardAiPlaceholder: "How do I hit my protein target? ...",
    dashboardAiInputAria: "Question for AI",
    dashboardAiSubmitAria: "Send and open chat",
    dashboardStepsTitle: "Steps",
    dashboardStepsHint: "How about\na short\nwalk?",
    dashboardStepsSyncing: "Syncing...",
    dashboardStepsSync: "Sync steps",
    dashboardStepsMobileOnly: "Log steps in the app only",
    dashboardStepsOpenInApp: "Open in app",
    shoppingListOfflineMode: "Offline mode active",
    shoppingListStillNeeded: "still needed",
    shoppingListShowAll: "Show all",
    shoppingListCollapseAll: "Collapse all",
    shoppingListSaveOffline: "Save offline",
    shoppingListLastSaved: "Last saved",
    shoppingListCacheLoaded: "Loaded from cache",
    shoppingListOfflineSavedTitle: "✅ Saved offline!",
    shoppingListOfflineSavedDesc: "Your shopping list is now available in the store without internet.",
    shoppingListOfflineToastTitle: "📴 Offline mode",
    shoppingListOfflineToastDesc: "The shopping list is still available!",
    shoppingListOfCount: "of",
    shoppingListNotGenerated: "Not generated yet",
    shoppingListDayCount: "{count} days",
    shoppingCategoryFruitVeg: "Fruit & vegetables",
    shoppingCategoryMeatFish: "Meat & fish",
    shoppingCategoryDairy: "Dairy",
    shoppingCategoryBreadGrains: "Bread & grains",
    shoppingCategoryPantry: "Pantry",
    shoppingCategoryOther: "Other",
    mealPlanPremiumActivatingTitle: "Premium is being activated...",
    mealPlanPremiumActivatingDesc: "Please wait a moment while we set up your subscription.",
    mealPlanDetectIngredients: "Detect ingredients",
    mealPlanCreating: "Creating...",
    mealPlanCreateShort: "Create",
    mealPlanMealAddedDesc: "Meal added to your tracker",
    ingredientDefaultName: "Ingredient",
    dietBalanced: "Balanced nutrition",
    dietVegan: "Vegan",
    dietVegetarian: "Vegetarian",
    dietKeto: "Keto",
    dietLowCarb: "Low-carb",
    dietPaleo: "Paleo",
    dietPreferencesTitle: "Diet style",
    dietPreferencesSubtitle: "Used for recipes and weekly plan",
    dietPreferencesSavedTitle: "Saved",
    dietPreferencesSavedDesc: "Your diet preference was updated.",
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
    communityEmptyPostsTitle: "Pas encore de publications",
    communityEmptyPostsDesc: "Partage ta première recette — les publications apparaîtront ici au fil de la communauté.",
    landingTestimonialAuthor: "Utilisateur Frigy",
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
    landingFeatureHealthTitle: "Plans repas hebdo",
    landingFeatureHealthDesc: "Plans hebdomadaires IA adaptés à tes objectifs et ingrédients.",
    landingTestimonial1: "Enfin une app qui comprend ce qu'il y a dans mon frigo !",
    landingTestimonial2: "Les plans hebdomadaires correspondent à mes macros et font gagner du temps aux courses.",
    landingTestimonial3: "La communauté est super motivante !",
    landingPremiumFeature1: "Scans illimités",
    landingPremiumFeature2: "Chatbot IA",
    landingPremiumFeature3: "Plans hebdomadaires",
    landingPremiumFeature4: "Listes de courses",
    landingPremiumFeature5: "Suivi des macros",
    landingPremiumFeature6: "Suivi d'eau",
    landingPremiumFeature7: "Progrès & badges",
    landingPremiumFeature8: "Objectifs nutrition personnalisés",

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

    healthSyncTitle: "Suivi du poids",
    healthSyncWeightPlaceholder: "Poids en kg",

    orderIngredientsBtn: "Commander les ingrédients",
    shareRecipeBtn: "Partager",
    addToTrackerBtn: "Ajouter au tracker",

    onboardingWelcomeHeadline1: "Mange plus malin.",
    onboardingWelcomeHeadline2: "Vis plus léger.",
    onboardingWelcomeSubline: "Génère des plans hebdo, scanne ton frigo et obtiens automatiquement ta liste de courses.",
    onboardingGetStarted: "Commencer",
    onboardingFirstWeeklyPlanTitle: "Crée ton premier plan hebdo Frigy !",
    onboardingFirstWeeklyPlanDesc: "Frigy planifie ta semaine selon tes macros — avec liste de courses.",
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
    postPayCoachScanLine:
      "Scanne ton frigo — Frigy détecte tes ingrédients et crée un",
    postPayCoachShoppingLine:
      "La liste de courses est générée à partir du plan hebdo — seulement ce qui te manque encore.",

    navHome: "Accueil",
    navPlanShort: "Plan",
    navShoppingShort: "Courses",
    ariaMainNavigation: "Navigation principale",

    scanAllIngredientsPresent: "Tout est disponible — rien ne manque.",
    scanCameraDevHintOpen: "Ouvre l'app avec ",
    scanCameraDevHintLocalhost: " sur ",
    scanCameraDevHintOrGallery: " — ou utilise la galerie en bas.",
    scanCapturePhoto: "Prendre une photo",
    scanCaptureSr: "Capture",
    scanPhotosQueued: "{count} photo(s)",
    scanPhotoCounter: "Photo {current} sur {total}",
    scanFileTooLarge: "Fichier trop volumineux",
    scanPhotoReadError: "Impossible de lire la photo.",
    scanPhotoFailedContinue: "Échec photo {n}. Photo suivante…",
    scanPhotoTimeoutContinue: "La photo {n} a pris trop de temps. Photo suivante…",
    scanPhotosAnalyzedSummary: "{analyzed} sur {total} photo(s) analysée(s)",
    scanPhotosSkippedSuffix: " ({skipped} ignorée(s))",

    barcodeUnknownProduct: "Produit inconnu",
    barcodeProductRecognized: "Produit reconnu !",
    barcodeProductNotFound: "Produit introuvable",
    barcodeFetchError: "Erreur lors de la récupération du produit",
    barcodeNoCameraSupport: "Ton navigateur ne prend pas en charge la caméra",
    barcodeNeedsHttps: "La caméra nécessite HTTPS. Ouvre l'app via localhost, HTTPS ou en app installée.",
    barcodeScannerOpenFailed: "Impossible d'ouvrir le scanner",
    barcodeScannerLoadFailed: "Impossible de charger le scanner de codes-barres",
    barcodeCameraStartFailed: "Impossible de démarrer la caméra",
    barcodeCameraDenied: "Accès à la caméra refusé !",
    barcodeCameraNotFound: "Aucune caméra trouvée !",
    barcodeCameraInUse: "La caméra est déjà utilisée !",
    barcodeCameraHttpsRequired: "La caméra nécessite HTTPS ou localhost",
    barcodeCameraInitSlow: "Initialisation de la caméra trop lente",
    barcodeScanNewProduct: "Scanner un nouveau produit",
    barcodeHoldInFrame: "Place le code-barres dans le cadre",
    barcodeLoadingProduct: "Chargement du produit…",
    ariaCloseScanner: "Fermer le scanner",
    barcodeBrandLabel: "Marque :",
    barcodeCaloriesLabel: "Calories :",
    barcodeCarbsLabel: "Glucides :",
    barcodeFatLabel: "Lipides :",
    barcodeProteinLabel: "Protéines :",

    scanResultGeneratePlan: "Générer le plan hebdo",
    scanResultGeneratePlanDesc: "À partir de tes ingrédients analysés et de tes objectifs macros.",
    scanResultGeneratingPlan: "Création de ton plan hebdo personnel…",
    scanResultNewPhoto: "Nouvelle photo",
    scanResultRetryScan: "Réessayer ou prendre une photo sous un meilleur angle.",

    premiumActivating: "Activation de Premium…",
    premiumActivatingDesc: "Un instant — nous lions ton paiement à ton compte.",
    premiumNotActiveYet: "Premium pas encore actif",
    premiumNotActiveDesc:
      "Paiement reçu, mais Premium n'est pas encore activé. Rouvre l'app ou réessaie dans quelques minutes.",
    defaultMealName: "Repas",

    onboardingStepCounter: "Étape {current} sur {total}",
    trackerMealsPerDayTitle: "Repas par jour",
    trackerMealsPerDaySubtitle: "Combien de repas veux-tu par jour ?",
    trackerMealsUnit: "repas",
    trackerPaceSlow: "Lent & durable",
    trackerPaceModerate: "Modéré",
    trackerPaceFast: "Rapide",
    trackerPaceVeryFast: "Très rapide",
    dailyOverviewTitle: "Aperçu du jour",
    dailyOverviewGoalsBadge: "{count}/3 objectifs",
    dailyOverviewMealsLogged: "enregistrés",
    dailyOverviewRemainingCalories: "Encore {calories} kcal pour aujourd'hui",
    dailyOverviewCalorieGoalReached: "Objectif calories atteint !",
    dailyOverviewOfKcal: "sur {target} kcal",
    dailyOverviewOfLiters: "sur {target}L",
    macroEditCarbsCalculated: "Glucides calculés",
    macroEditCarbsCalculatedDesc: "Glucides définis à {carbs}g pour atteindre {calories} kcal.",
    macroEditInvalidValue: "Valeur invalide",
    macroEditCaloriesRange: "Les calories doivent être entre 800 et 10000",
    macroEditMacroMismatchWarning: "Avertissement",
    macroEditMacroMismatchDesc: "Les protéines et les lipides sont trop élevés pour cet objectif calorique.",
    macroEditGoalsSaved: "Objectifs sauvegardés !",
    macroEditGoalsSavedDesc: "Tes nouveaux objectifs macro ont été appliqués.",
    macroEditAutoCarbs: "Auto glucides",
    macroEditCaloriesLabel: "Calories",
    profileDeleting: "Suppression…",
    profileDeleteBtn: "Supprimer",

    motivationTitle: "Qu'est-ce qui te motive ?",
    motivationSubtitle: "Choisis ta raison principale",
    motivationHealthLabel: "Vivre plus sainement",
    motivationHealthDesc: "Plus d'énergie au quotidien",
    motivationConfidenceLabel: "Plus de confiance",
    motivationConfidenceDesc: "Bien dans son corps",
    motivationEventLabel: "Pour un événement",
    motivationEventDesc: "Mariage, vacances, etc.",
    motivationDoctorLabel: "Priorité santé",
    motivationDoctorDesc: "Objectifs santé personnels",
    motivationFitnessLabel: "Améliorer fitness",
    motivationFitnessDesc: "Objectifs sportifs",
    motivationHabitLabel: "Meilleures habitudes",
    motivationHabitDesc: "Changement durable",
    cookingTimeTitle: "Combien de temps pour cuisiner ?",
    cookingTimeSubtitle: "Pour des suggestions adaptées",
    cookingTimeChangeLaterHint: "Tu peux changer cela plus tard dans les paramètres",
    cookingTime15Label: "15 minutes",
    cookingTime15Desc: "Plats rapides",
    cookingTime30Label: "30 minutes",
    cookingTime30Desc: "Recettes normales",
    cookingTime45Label: "45+ minutes",
    cookingTime45Desc: "Cuisine élaborée",
    onboardingNonBinaryLabel: "Non-binaire",
    onboardingGenderQuestionTitle: "Quel est ton genre ?",
    onboardingDataDeletedAfterPlan: "Pas un conseil médical — les estimations IA peuvent être inexactes.",
    onboardingMinAgeNotice: "Âge minimum : 9 ans. Frigy ne remplace pas un avis médical.",
    aiDisclaimerShort:
      "Estimations générées par IA — pas un conseil médical. Vérifie toujours les allergènes sur l'étiquette.",
    accountDeletedTitle: "Compte supprimé",
    accountDeletedDesc: "Ton compte a été supprimé avec succès.",
    userNotAuthenticated: "Utilisateur non authentifié",
    purchasesRestoredMsg: "Achats restaurés.",
    chatDarkModeOnTitle: "Mode sombre activé",
    chatDarkModeOnDesc: "L'app est maintenant en mode sombre.",
    chatDarkModeOffTitle: "Mode clair activé",
    chatDarkModeOffDesc: "L'app est maintenant en mode clair.",
    chatRegeneratePlanTitle: "Nouveau plan hebdo",
    chatRegeneratePlanDesc: "Ton plan hebdomadaire est en cours de génération.",
    closeAiChatAria: "Fermer le chat IA",
    paywallSignOut: "Se déconnecter et utiliser un autre compte",
    onboardingHowTallTitle: "Quelle est ta taille ?",
    onboardingCurrentWeightTitle: "Quel est ton poids actuel ?",
    onboardingBirthdateTitle: "Quand es-tu né(e) ?",
    onboardingBirthdateFormat: "Format : JJ.MM.AAAA",
    onboardingBirthdateError: "Entre une date de naissance valide.",
    onboardingBirthdateTooYoung: "Tu dois avoir au moins 9 ans pour utiliser Frigy.",
    onboardingUnitMetric: "Métrique",
    onboardingUnitImperial: "Imperial",
    onboardingHeightHelperMetric: "Par exemple 170",
    onboardingHeightHelperImperial: "Par exemple 5'7",
    onboardingHeightErrorMetric: "Entre une taille entre 100 et 250 cm.",
    onboardingHeightErrorImperial: "Entre une taille comme 5'7.",
    onboardingWeightHelperMetric: "Par exemple 70,0",
    onboardingWeightHelperImperial: "Par exemple 154.3",
    onboardingWeightErrorMetric: "Entre un poids entre 30,0 et 250,0 kg.",
    onboardingWeightErrorImperial: "Entre un poids entre 66.0 et 550.0 lbs.",
    onboardingTargetWeightLoseTitle: "Quel est ton poids cible ?",
    onboardingTargetWeightGainTitle: "Quel est ton poids souhaité ?",
    onboardingTargetWeightMaintainTitle: "Confirme ton poids cible",
    onboardingTargetWeightFallbackTitle: "Quel est ton poids cible ?",
    onboardingTargetWeightSetGoal: "Définir l'objectif",
    onboardingTargetWeightHelperMetric: "Par exemple 65,0",
    onboardingTargetWeightHelperImperial: "Par exemple 143.3",
    onboardingTargetWeightErrorMetric: "Entre un poids cible entre 30,0 et 250,0 kg.",
    onboardingTargetWeightErrorImperial: "Entre un poids cible entre 66.0 et 550.0 lbs.",
    authLoginFailed: "Échec de connexion",
    authSignInIncomplete: "Connexion impossible. Réessaie.",
    authPasswordMinLength: "Le mot de passe doit contenir au moins 6 caractères",
    authInvalidEmail: "Entre une adresse e-mail valide",
    authSignupFailed: "Inscription échouée",
    premiumCheckoutHint: "Mensuel ou annuel – détails au paiement",
    premiumTrialHint: "3 jours d'essai gratuit · puis 9,99 €/mois",
    premiumViewPlansBtn: "Voir les plans",
    choosePlanTitle: "Choisis ton plan",
    healthSyncStepsLogged: "{count} pas",
    onboardingUnitAriaLabel: "Unité",
    onboardingHelloPrefix: "Salut",
    onboardingHelloDefaultName: "toi",
    calorieDeficitLabel: "Déficit calorique",
    calorieSurplusLabel: "Surplus calorique",
    youWillReachSuffix: "",
    macroEditProteinAria: "Modifier les protéines",
    macroEditCarbsAria: "Modifier les glucides",
    macroEditFatAria: "Modifier les lipides",
    scanLaterShort: "Scanner plus tard",
    scanFeedbackNotEnough: "Trop peu d'ingrédients détectés",
    scanFeedbackWrongItems: "Mauvais ingrédients détectés",
    scanFeedbackTooSlow: "Trop lent",
    scanFeedbackOther: "Autre",
    scanFeedbackTitle: "Le scan t'a plu ?",
    scanFeedbackSubtitle: "Ton avis nous aide à nous améliorer",
    scanFeedbackYes: "Oui !",
    scanFeedbackNo: "Non",
    scanFeedbackThanks: "Super, merci ! 🎉",
    scanFeedbackIssueTitle: "Quel était le problème ?",
    scanFeedbackDidntScan: "Je n'ai pas scanné",
    onboardingCookingStyleTitle: "Comment veux-tu cuisiner ?",
    onboardingCookingStyleSubtitle: "Choisis ton style – tu peux le changer plus tard",
    onboardingSpontaneousLabel: "🎲 Spontané & Flexible",
    onboardingSpontaneousDesc: "Scanne ton frigo, choisis ton humeur – reçois des recettes adaptées",
    onboardingStructuredLabel: "📋 Structuré & Planifié",
    onboardingStructuredDesc: "Plan hebdomadaire qui atteint tes macros + liste de courses automatique",
    onboardingSpontaneousModeTitle: "Mode Spontané",
    onboardingScanFridgeIntroTitle: "Scanne ton frigo",
    onboardingScanFridgeIntroSubtitle: "Montre-nous ce que tu as – on en fait des recettes",
    onboardingScanFeaturePhoto: "Prends une photo de ton frigo",
    onboardingScanFeatureAi: "L'IA reconnaît automatiquement tous les ingrédients",
    onboardingScanFeatureRecipes: "Reçois 3 recettes selon ton humeur",
    onboardingCameraRequiredHint: "Nous avons besoin d'accéder à la caméra pour le scan",
    onboardingScanNowBtn: "Scanner maintenant",
    onboardingScanLaterBtn: "Scanner plus tard",
    onboardingStep2of2: "Étape 2 sur 2",
    onboardingMoodTitle: "Comment te sens-tu ?",
    onboardingMoodSubtitle: "Ton humeur détermine la complexité des recettes",
    onboardingMoodTiredLabel: "Fatigué",
    onboardingMoodTiredDesc: "Recettes super simples de 5 minutes",
    onboardingMoodNormalLabel: "Normal",
    onboardingMoodNormalDesc: "Plats équilibrés de 15-20 minutes",
    onboardingMoodMotivatedLabel: "Motivé",
    onboardingMoodMotivatedDesc: "Créations plus élaborées",
    onboardingMoodRecipesHint: "Tu reçois 3 recettes personnalisées basées sur tes ingrédients + humeur",
    onboardingGotIt: "Compris !",
    onboardingStep1of3: "Étape 1 sur 3",
    onboardingStep2of3: "Étape 2 sur 3",
    onboardingStep3of3: "Étape 3 sur 3",
    onboardingWeeklyPlanIntroTitle: "Ton plan hebdomadaire",
    onboardingWeeklyPlanIntroSubtitle: "7 jours parfaitement adaptés à tes macros",
    onboardingWeeklyPlanFeature1: "Chaque jour atteint exactement tes calories & macros",
    onboardingWeeklyPlanFeature2: "5 repas par jour – du petit-déjeuner au dîner",
    onboardingWeeklyPlanFeature3: "Échanger des repas individuels à tout moment",
    onboardingShoppingIntroTitle: "Liste de courses automatique",
    onboardingShoppingIntroSubtitle: "Tout ce dont tu as besoin pour la semaine",
    onboardingShoppingFeature1: "Liste générée à partir du plan hebdomadaire",
    onboardingShoppingFeature2: "Cocher en faisant les courses",
    onboardingShoppingFeature3: "Le scan met à jour ta liste automatiquement",
    onboardingCycleTitle: "Le cycle",
    onboardingCycleSubtitle: "Scan → Plan → Courses → Répéter",
    onboardingCycleLabelScan: "Scanner",
    onboardingCycleLabelPlan: "Planifier",
    onboardingCycleLabelShop: "Courses",
    onboardingCycleEveryWeek: "Chaque semaine",
    onboardingCycleFridgeUpdateHint: "Ton scan de frigo met à jour automatiquement ce dont tu as besoin",
    onboardingGenderNotebookQuestion: "QUEL EST TON\nGENRE ?",
    profileNutritionSection: "Alimentation",
    badgeUnlockedToast: "{icon} Nouveau badge débloqué !",

    dashboardWaterEmpty: "Encore soif ?\nCommence avec\nun verre d'eau",
    dashboardAddMealLabel: "Repas",
    dashboardAddMealTitle: "Que manges-tu ?",
    dashboardScanMealTitle: "Scanner un repas",
    dashboardScanMealSubtitle: "Caméra · saisie rapide",
    dashboardManualMealTitle: "Ajouter manuellement",
    dashboardManualMealSubtitle: "Suivi",
    dashboardGenerateRecipeTitle: "Générer une recette",
    dashboardGenerateRecipeSubtitle: "IA · depuis ton frigo",
    dashboardShoppingWidgetLabel: "Liste",
    dashboardShoppingEmpty: "Vide",
    dashboardShoppingAllDone: "Tout est là",
    dashboardShoppingOpenCount: "{count} ouverts",
    dashboardShoppingOpen: "Ouvrir",
    dashboardShoppingNoIngredients: "Aucun ingrédient pour le moment",
    dashboardShoppingHint: "Coche les ingrédients ici. Plus dans l'onglet Courses.",
    dashboardWeeklyPlanNextLabel: "Prochain repas",
    dashboardWeeklyPlanNextFallback: "Pas encore de plan",
    dashboardWeeklyPlanHint: "Crée ton plan hebdomadaire",
    dashboardWeeklyPlanCta: "Voir aujourd'hui",
    dashboardWeeklyPlanCtaEmpty: "Voir le plan",
    dashboardNoPlanEntry: "Aucune entrée dans le plan",
    dashboardTrackerOverGoal: "au-dessus de l'objectif",
    dashboardTrackerRemaining: "restants",
    dashboardQuickLog: "Ajout rapide",
    dashboardAddMealBtn: "Ajouter",
    dashboardMealsTitle: "Repas",
    dashboardMealSlotsSubtitle: "Ajouter aujourd'hui",
    dashboardFindThreeMeals: "Trouver 3 plats",
    dashboardAiAdvisorLabel: "Conseiller IA",
    dashboardAiAskTitle: "Poser une question",
    dashboardAiPlaceholder: "Comment couvrir mes protéines ? ...",
    dashboardAiInputAria: "Question pour l'IA",
    dashboardAiSubmitAria: "Envoyer et ouvrir le chat",
    dashboardStepsTitle: "Pas",
    dashboardStepsHint: "Et si tu faisais\nune petite\nmarche ?",
    dashboardStepsSyncing: "Synchronisation...",
    dashboardStepsSync: "Synchroniser les pas",
    dashboardStepsMobileOnly: "Pas saisis uniquement dans l'app",
    dashboardStepsOpenInApp: "Ouvrir dans l'app",
    shoppingListOfflineMode: "Mode hors ligne actif",
    shoppingListStillNeeded: "encore nécessaire",
    shoppingListShowAll: "Tout afficher",
    shoppingListCollapseAll: "Tout réduire",
    shoppingListSaveOffline: "Enregistrer hors ligne",
    shoppingListLastSaved: "Dernière sauvegarde",
    shoppingListCacheLoaded: "Données chargées depuis le cache",
    shoppingListOfflineSavedTitle: "✅ Enregistré hors ligne !",
    shoppingListOfflineSavedDesc: "La liste de courses est maintenant disponible sans internet.",
    shoppingListOfflineToastTitle: "📴 Mode hors ligne",
    shoppingListOfflineToastDesc: "La liste de courses reste disponible !",
    shoppingListOfCount: "sur",
    shoppingListNotGenerated: "Pas encore généré",
    shoppingListDayCount: "{count} jours",
    shoppingCategoryFruitVeg: "Fruits et légumes",
    shoppingCategoryMeatFish: "Viande et poisson",
    shoppingCategoryDairy: "Produits laitiers",
    shoppingCategoryBreadGrains: "Pain et céréales",
    shoppingCategoryPantry: "Placard",
    shoppingCategoryOther: "Autres",
    mealPlanPremiumActivatingTitle: "Premium s'active...",
    mealPlanPremiumActivatingDesc: "Patiente un instant pendant que nous configurons ton abonnement.",
    mealPlanDetectIngredients: "Reconnaître les ingrédients",
    mealPlanCreating: "Création...",
    mealPlanCreateShort: "Créer",
    mealPlanMealAddedDesc: "Repas ajouté à ton suivi",
    ingredientDefaultName: "Ingrédient",
    dietBalanced: "Alimentation équilibrée",
    dietVegan: "Végan",
    dietVegetarian: "Végétarien",
    dietKeto: "Cétogène",
    dietLowCarb: "Faible en glucides",
    dietPaleo: "Paléo",
    dietPreferencesTitle: "Régime alimentaire",
    dietPreferencesSubtitle: "Utilisé pour les recettes et le plan hebdo",
    dietPreferencesSavedTitle: "Enregistré",
    dietPreferencesSavedDesc: "Ton régime alimentaire a été mis à jour.",
  },
};

/** Replace `{n}` placeholders in translated strings. */
export function formatTranslation(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}
