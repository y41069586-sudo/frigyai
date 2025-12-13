import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "de" | "en" | "fr";

interface Translations {
  // Navigation & Common
  login: string;
  logout: string;
  favorites: string;
  mealPlans: string;
  shoppingList: string;
  tracker: string;
  water: string;
  stats: string;
  premium: string;
  settings: string;
  manageSubscription: string;
  cancelSubscription: string;
  save: string;
  cancel: string;
  close: string;
  next: string;
  back: string;
  skip: string;
  start: string;
  loading: string;
  error: string;
  success: string;
  or: string;
  
  // Home Page
  homeTitle: string;
  homeSubtitle: string;
  scanFridge: string;
  scansRemaining: string;
  unlimitedWithPremium: string;
  tip: string;
  tipText: string;
  dailyGoal: string;
  protein: string;
  carbs: string;
  fat: string;
  unlockPremium: string;
  premiumFeatures: string;
  perMonth: string;
  signInForFeatures: string;
  startNow: string;
  
  // Scanner
  barcodeScanner: string;
  productRecognized: string;
  productNotFound: string;
  barcodeNotInDatabase: string;
  productSearching: string;
  cameraAccessDenied: string;
  noCameraFound: string;
  cameraError: string;
  tryAgain: string;
  instantRecognition: string;
  safariMode: string;
  analyzingFood: string;
  
  // Onboarding
  selectLanguage: string;
  onboardingSlide1Title: string;
  onboardingSlide1Subtitle: string;
  onboardingSlide2Title: string;
  onboardingSlide2Subtitle: string;
  onboardingSlide3Title: string;
  onboardingSlide3Subtitle: string;
  onboardingSlide4Title: string;
  onboardingSlide4Subtitle: string;
  onboardingSlide5Title: string;
  onboardingSlide5Subtitle: string;
  onboardingSlide6Title: string;
  onboardingSlide6Subtitle: string;
  // New onboarding slides 7-14
  onboardingSlide7Title: string;
  onboardingSlide7Subtitle: string;
  onboardingSlide8Title: string;
  onboardingSlide8Subtitle: string;
  onboardingSlide9Title: string;
  onboardingSlide10Title: string;
  onboardingSlide11Title: string;
  onboardingSlide12Title: string;
  onboardingSlide13Title: string;
  onboardingSlide14Title: string;
  // Health Sync options
  healthSyncTitle: string;
  healthSyncSubtitle: string;
  connectAppleHealth: string;
  connectGoogleFit: string;
  skipForNow: string;
  communityTitle: string;
  communitySubtitle: string;
  joinCommunity: string;
  maybeLater: string;
  // Question options
  howDidYouHear: string;
  optionTikTok: string;
  optionYouTube: string;
  optionInstagram: string;
  optionFriends: string;
  optionOther: string;
  whatIsYourMainGoal: string;
  goalLoseWeight: string;
  goalEatHealthier: string;
  goalSaveTime: string;
  goalLearnCooking: string;
  howOftenCook: string;
  cookDaily: string;
  cookFewTimes: string;
  cookRarely: string;
  cookNever: string;
  biggestChallenge: string;
  challengeNoIdeas: string;
  challengeNoTime: string;
  challengeCalories: string;
  challengeIngredients: string;
  recipe: string;
  
  // Plan Selection
  choosePlan: string;
  freePlan: string;
  freePlanDesc: string;
  freeFeature1: string;
  freeFeature2: string;
  freeFeature3: string;
  premiumPlan: string;
  premiumPlanDesc: string;
  premiumFeature1: string;
  premiumFeature2: string;
  premiumFeature3: string;
  premiumFeature4: string;
  premiumFeature5: string;
  premiumFeature6: string;
  premiumFeature7: string;
  freeTrialInfo: string;
  continueWithFree: string;
  startFreeTrial: string;
  ingredients: string;
  
  // Auth
  email: string;
  password: string;
  confirmPassword: string;
  signIn: string;
  signUp: string;
  signInWithGoogle: string;
  noAccount: string;
  alreadyHaveAccount: string;
  forgotPassword: string;
  
  // Tracker
  age: string;
  years: string;
  weight: string;
  kg: string;
  targetWeight: string;
  setupTracker: string;
  caloriesPerDay: string;
  addFood: string;
  eaten: string;
  kcalLeft: string;
  today: string;
  changeGoal: string;
  howOldAreYou: string;
  howMuchDoYouWeigh: string;
  whatIsYourGoalIn4Weeks: string;
  loseWeight: string;
  yourPersonalPlan: string;
  baseMetabolism: string;
  withActivity: string;
  deficit: string;
  goal: string;
  inWeeks: string;
  weeklyRate: string;
  calorieGoalSet: string;
  forYourHealth: string;
  foodAdded: string;
  entryUpdated: string;
  couldNotAnalyzeFood: string;
  patienceMessage: string;
  calculatingCalories: string;
  determiningNutrients: string;
  almostDone: string;
  
  // Meal Plans
  weeklyPlan: string;
  generateNewPlan: string;
  breakfast: string;
  morningSnack: string;
  lunch: string;
  afternoonSnack: string;
  dinner: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  newPlanGenerated: string;
  planWithKcal: string;
  couldNotGeneratePlan: string;
  setupTrackerFirst: string;
  reminderSettings: string;
  
  // Water Tracker
  waterTracker: string;
  addGlass: string;
  glasses: string;
  glassesOf: string;
  waterGoal: string;
  waterAdded: string;
  goalReached: string;
  dailyGoalReached: string;
  wellDone: string;
  setDailyGoal: string;
  perDay: string;
  goalSaved: string;
  ofGoal: string;
  
  // Progress & Stats
  progressTracker: string;
  weightProgress: string;
  addWeight: string;
  noDataYet: string;
  current: string;
  lost: string;
  progressToGoal: string;
  goalAchieved: string;
  invalidWeight: string;
  weightAdded: string;
  
  // Toasts
  toastProductAdded: string;
  toastFoodLogged: string;
  toastWaterAdded: string;
  toastGoalReached: string;
  toastError: string;
  toastSuccess: string;
  notLoggedIn: string;
  loadingStripePortal: string;
  pleaseWait: string;
  
  // Bottom Navigation
  navMealPlan: string;
  navShopping: string;
  navTracker: string;
  navWater: string;
  navStats: string;
  
  // Snack
  snack: string;
  
  // Scan Page
  scanTitle: string;
  uploadPhoto: string;
  takePhotoOrSelect: string;
  selectImage: string;
  ingredientsRecognized: string;
  ingredientsFound: string;
  couldNotAnalyze: string;
  newPhoto: string;
  generateRecipes: string;
  dailyScanLimitReached: string;
  usedScansToday: string;
  upgradeToPremium: string;
  unlimited: string;
  loginRequired: string;
  loginToUseScanner: string;
  scanLimitReached: string;
  aiAnalyzingIngredients: string;
  
  // Recipes Page
  yourRecipes: string;
  regenerate: string;
  aiCreatingRecipes: string;
  momentPlease: string;
  noRecipesFound: string;
  tryOtherIngredients: string;
  backToStart: string;
  recipesGenerated: string;
  healthyRecipesFound: string;
  
  // Favorites
  myFavorites: string;
  noFavoritesYet: string;
  saveFavoriteRecipes: string;
  discoverRecipes: string;
  
  // Recipe Card
  proteinLabel: string;
  carbsLabel: string;
  fatLabel: string;
  more: string;
  
  // Premium Page
  premiumActive: string;
  renewsOn: string;
  manage: string;
  overview: string;
  quickAccess: string;
  setupTrackerButton: string;
  yourPremiumFeatures: string;
  weeklyPersonalizedMealPlans: string;
  automaticShoppingLists: string;
  macroTrackingCalorieAnalysis: string;
  unlimitedRecipeGeneration: string;
  waterTrackerFeature: string;
  weightProgressFeature: string;
  getPremiumNow: string;
  
  // Shopping List
  shoppingListTitle: string;
  ofPurchased: string;
  spent: string;
  generateMealPlanForList: string;
  
  // AI Chatbot
  aiAdvisor: string;
  yourNutritionExpert: string;
  helloImAI: string;
  askAboutRecipes: string;
  yourGoalLabel: string;
  askMeSomething: string;
  trackerReset: string;
  goalsReset: string;
  couldNotProcess: string;
  
  // Session expired
  sessionExpired: string;
  pleaseLoginAgain: string;
  
  // MacroTracker specific
  nothingEatenToday: string;
  addFirstFood: string;
  egTwoEggsWithToast: string;
  takePhoto: string;
  scanBarcode: string;
  letsGo: string;
  
  // Language Settings
  languageSettings: string;
  changeLanguage: string;
  german: string;
  english: string;
  french: string;
  redirectingToStripe: string;
  noCheckoutUrl: string;
  noPortalUrl: string;
}

const translations: Record<Language, Translations> = {
  de: {
    // Navigation & Common
    login: "Anmelden",
    logout: "Abmelden",
    favorites: "Favoriten",
    mealPlans: "Wochenpläne",
    shoppingList: "Einkaufsliste",
    tracker: "Tracker",
    water: "Wasser",
    stats: "Statistiken",
    premium: "Premium",
    settings: "Einstellungen",
    manageSubscription: "Abo verwalten",
    cancelSubscription: "Abo kündigen",
    save: "Speichern",
    cancel: "Abbrechen",
    close: "Schließen",
    next: "Weiter",
    back: "Zurück",
    skip: "Überspringen",
    start: "Los geht's",
    loading: "Laden...",
    error: "Fehler",
    success: "Erfolgreich",
    or: "Oder",
    
    // Home Page
    homeTitle: "Leichter Abnehmen",
    homeSubtitle: "Kühlschrank scannen • Tracker einstellen • Abnehm-Rezepte genießen",
    scanFridge: "Kühlschrank scannen",
    scansRemaining: "Scans heute übrig",
    unlimitedWithPremium: "Unlimited mit Premium",
    tip: "Tipp",
    tipText: "Scanne deinen Kühlschrank und erhalte sofort kalorienarme Rezepte mit nur 3-4 Zutaten.",
    dailyGoal: "Dein Tagesziel",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fett",
    unlockPremium: "Premium freischalten",
    premiumFeatures: "Tracker • Wochenpläne • Einkaufslisten",
    perMonth: "/Monat",
    signInForFeatures: "Anmelden für alle Features",
    startNow: "Jetzt starten",
    
    // Scanner
    barcodeScanner: "Barcode scannen",
    productRecognized: "Produkt erkannt!",
    productNotFound: "Produkt nicht gefunden",
    barcodeNotInDatabase: "Dieser Barcode ist nicht in der Datenbank.",
    productSearching: "Produkt wird gesucht...",
    cameraAccessDenied: "Kamera-Zugriff verweigert. Bitte erlaube den Zugriff.",
    noCameraFound: "Keine Kamera gefunden.",
    cameraError: "Kamera konnte nicht gestartet werden.",
    tryAgain: "Erneut versuchen",
    instantRecognition: "⚡ Sofort-Erkennung aktiv",
    safariMode: "Safari-Modus",
    analyzingFood: "Dein Essen wird analysiert...",
    
    // Onboarding
    selectLanguage: "Sprache wählen",
    onboardingSlide1Title: "Willkommen!",
    onboardingSlide1Subtitle: "Dein smarter Kühlschrank-Assistent",
    onboardingSlide2Title: "Kühlschrank scannen",
    onboardingSlide2Subtitle: "Mach ein Foto von deinem Kühlschrank",
    onboardingSlide3Title: "KI analysiert",
    onboardingSlide3Subtitle: "Erkennt automatisch alle Zutaten",
    onboardingSlide4Title: "Rezepte erhalten",
    onboardingSlide4Subtitle: "Kalorienarme Rezepte mit nur 3-4 Zutaten",
    onboardingSlide5Title: "Fortschritt tracken",
    onboardingSlide5Subtitle: "Behalte deine Kalorien im Blick",
    onboardingSlide6Title: "Leichter abnehmen",
    onboardingSlide6Subtitle: "Erreiche dein Wunschgewicht",
    // New onboarding slides 7-14
    onboardingSlide7Title: "Health Sync",
    onboardingSlide7Subtitle: "Verbinde deine Gesundheitsdaten",
    onboardingSlide8Title: "Community",
    onboardingSlide8Subtitle: "Teile Rezepte & verbinde dich",
    onboardingSlide9Title: "Über 10.000 zufriedene Nutzer",
    onboardingSlide10Title: "Wie hast du von uns erfahren?",
    onboardingSlide11Title: "Was ist dein Hauptziel?",
    onboardingSlide12Title: "Wie oft kochst du?",
    onboardingSlide13Title: "Was ist deine größte Herausforderung?",
    onboardingSlide14Title: "Du bist bereit! 🎉",
    // Health Sync options
    healthSyncTitle: "Health Sync aktivieren?",
    healthSyncSubtitle: "Synchronisiere Gewicht & Aktivitäten automatisch",
    connectAppleHealth: "Apple Health verbinden",
    connectGoogleFit: "Google Fit verbinden",
    skipForNow: "Später einstellen",
    communityTitle: "Community beitreten?",
    communitySubtitle: "Teile Rezepte und motiviere andere",
    joinCommunity: "Community beitreten",
    maybeLater: "Vielleicht später",
    // Question options
    howDidYouHear: "Wie hast du von uns erfahren?",
    optionTikTok: "TikTok",
    optionYouTube: "YouTube",
    optionInstagram: "Instagram",
    optionFriends: "Freunde",
    optionOther: "Andere",
    whatIsYourMainGoal: "Was ist dein Hauptziel?",
    goalLoseWeight: "Abnehmen",
    goalEatHealthier: "Gesünder essen",
    goalSaveTime: "Zeit sparen",
    goalLearnCooking: "Kochen lernen",
    howOftenCook: "Wie oft kochst du?",
    cookDaily: "Täglich",
    cookFewTimes: "Ein paar Mal pro Woche",
    cookRarely: "Selten",
    cookNever: "Fast nie",
    biggestChallenge: "Was ist deine größte Herausforderung?",
    challengeNoIdeas: "Keine Rezeptideen",
    challengeNoTime: "Keine Zeit zum Kochen",
    challengeCalories: "Kalorien zählen",
    challengeIngredients: "Zutaten verschwenden",
    recipe: "Rezept",
    ingredients: "Zutaten",
    
    // Plan Selection
    choosePlan: "Wähle deinen Plan",
    freePlan: "Kostenlos",
    freePlanDesc: "Perfekt zum Ausprobieren",
    freeFeature1: "2 Kühlschrank-Scans pro Tag",
    freeFeature2: "Basis-Rezeptvorschläge",
    freeFeature3: "Kalorien-Anzeige",
    premiumPlan: "Premium",
    premiumPlanDesc: "Alles was du zum Abnehmen brauchst",
    premiumFeature1: "Unbegrenzte Kühlschrank-Scans",
    premiumFeature2: "KI-Chatbot für Ernährungsfragen",
    premiumFeature3: "Personalisierte Wochenpläne",
    premiumFeature4: "Automatische Einkaufslisten",
    premiumFeature5: "Makro- & Kalorientracker",
    premiumFeature6: "Wasser-Tracker mit Erinnerungen",
    premiumFeature7: "Gewichtsverlauf & Statistiken",
    freeTrialInfo: "1 Woche kostenlos testen, dann €4,99/Monat",
    continueWithFree: "Kostenlos starten",
    startFreeTrial: "1 Woche gratis testen",
    
    // Auth
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    signIn: "Anmelden",
    signUp: "Registrieren",
    signInWithGoogle: "Mit Google anmelden",
    noAccount: "Noch kein Konto? Jetzt registrieren",
    alreadyHaveAccount: "Bereits registriert? Jetzt anmelden",
    forgotPassword: "Passwort vergessen?",
    
    // Tracker
    age: "Alter",
    years: "Jahre",
    weight: "Gewicht",
    kg: "kg",
    targetWeight: "Zielgewicht",
    setupTracker: "Tracker einrichten",
    caloriesPerDay: "Kalorien pro Tag",
    addFood: "Essen hinzufügen",
    eaten: "Gegessen",
    kcalLeft: "kcal übrig",
    today: "Heute",
    changeGoal: "Ziel ändern",
    howOldAreYou: "Wie alt bist du?",
    howMuchDoYouWeigh: "Wie viel wiegst du?",
    whatIsYourGoalIn4Weeks: "Was ist dein Ziel in 4 Wochen?",
    loseWeight: "abnehmen",
    yourPersonalPlan: "Dein persönlicher Plan",
    baseMetabolism: "Grundumsatz",
    withActivity: "Mit Aktivität",
    deficit: "Defizit",
    goal: "Ziel",
    inWeeks: "in 4 Wochen",
    weeklyRate: "/Woche",
    calorieGoalSet: "Kalorienziel auf",
    forYourHealth: "gesetzt für deine Gesundheit.",
    foodAdded: "Essen hinzugefügt",
    entryUpdated: "Eintrag aktualisiert",
    couldNotAnalyzeFood: "Konnte Essen nicht analysieren",
    patienceMessage: "Danke für die Geduld...",
    calculatingCalories: "Kalorien werden berechnet...",
    determiningNutrients: "Nährwerte ermitteln...",
    almostDone: "Fast fertig...",
    
    // Meal Plans
    weeklyPlan: "Wochenplan",
    generateNewPlan: "Neuen Plan erstellen",
    breakfast: "Frühstück",
    morningSnack: "Snack",
    lunch: "Mittagessen",
    afternoonSnack: "Snack",
    dinner: "Abendessen",
    monday: "Montag",
    tuesday: "Dienstag",
    wednesday: "Mittwoch",
    thursday: "Donnerstag",
    friday: "Freitag",
    saturday: "Samstag",
    sunday: "Sonntag",
    newPlanGenerated: "Neuer Wochenplan generiert!",
    planWithKcal: "Plan mit {kcal} kcal/Tag erstellt.",
    couldNotGeneratePlan: "Konnte Wochenplan nicht generieren",
    setupTrackerFirst: "Bitte richte zuerst deinen Tracker ein",
    reminderSettings: "Erinnerungen",
    
    // Water Tracker
    waterTracker: "Wasser-Tracker",
    addGlass: "Glas hinzufügen",
    glasses: "Gläser",
    glassesOf: "Gläser von",
    waterGoal: "Wasserziel",
    waterAdded: "+250ml getrunken!",
    goalReached: "Ziel erreicht!",
    dailyGoalReached: "Tagesziel erreicht!",
    wellDone: "Super gemacht!",
    setDailyGoal: "Tagesziel einstellen",
    perDay: "pro Tag",
    goalSaved: "Ziel gespeichert",
    ofGoal: "von",
    
    // Progress & Stats
    progressTracker: "Fortschritt",
    weightProgress: "Gewichtsverlauf",
    addWeight: "Gewicht hinzufügen",
    noDataYet: "Noch keine Daten",
    current: "Aktuell",
    lost: "Verloren",
    progressToGoal: "Fortschritt zum Ziel",
    goalAchieved: "Ziel erreicht!",
    invalidWeight: "Ungültiges Gewicht",
    weightAdded: "Gewicht eingetragen!",
    
    // Toasts
    toastProductAdded: "zum Tracker hinzugefügt",
    toastFoodLogged: "Essen erfasst",
    toastWaterAdded: "Wasser hinzugefügt",
    toastGoalReached: "Ziel erreicht!",
    toastError: "Ein Fehler ist aufgetreten",
    toastSuccess: "Erfolgreich gespeichert",
    notLoggedIn: "Nicht angemeldet",
    loadingStripePortal: "Lade Stripe-Portal...",
    pleaseWait: "Bitte warten",
    
    // Bottom Navigation
    navMealPlan: "Wochenplan",
    navShopping: "Einkaufsliste",
    navTracker: "Tracker",
    navWater: "Wasser",
    navStats: "Stats",
    
    // Snack
    snack: "Snack",
    
    // Scan Page
    scanTitle: "Kühlschrank scannen",
    uploadPhoto: "Foto hochladen",
    takePhotoOrSelect: "Mache ein Foto von deinem Kühlschrank oder wähle ein Bild aus",
    selectImage: "Bild auswählen",
    ingredientsRecognized: "Zutaten erkannt!",
    ingredientsFound: "Zutaten gefunden",
    couldNotAnalyze: "Bild konnte nicht analysiert werden. Bitte versuche es erneut.",
    newPhoto: "Neues Foto",
    generateRecipes: "Rezepte generieren",
    dailyScanLimitReached: "Tägliches Scan-Limit erreicht",
    usedScansToday: "Du hast heute bereits 2 Scans verwendet. Mit Premium bekommst du unbegrenzte Scans!",
    upgradeToPremium: "Upgrade auf Premium",
    unlimited: "Unbegrenzt",
    loginRequired: "Anmeldung erforderlich",
    loginToUseScanner: "Bitte melde dich an, um den Scanner zu nutzen.",
    scanLimitReached: "Scan-Limit erreicht",
    aiAnalyzingIngredients: "KI analysiert deine Zutaten...",
    
    // Recipes Page
    yourRecipes: "Deine Rezepte",
    regenerate: "Neu generieren",
    aiCreatingRecipes: "KI erstellt deine Rezepte",
    momentPlease: "Einen Moment bitte...",
    noRecipesFound: "Keine Rezepte gefunden. Versuche es mit anderen Zutaten.",
    tryOtherIngredients: "Versuche es mit anderen Zutaten",
    backToStart: "Zurück zum Start",
    recipesGenerated: "Rezepte generiert!",
    healthyRecipesFound: "gesunde Rezepte für dich gefunden.",
    
    // Favorites
    myFavorites: "Meine Favoriten",
    noFavoritesYet: "Noch keine Favoriten",
    saveFavoriteRecipes: "Speichere deine Lieblingsrezepte, um sie später wiederzufinden",
    discoverRecipes: "Rezepte entdecken",
    
    // Recipe Card
    proteinLabel: "Eiweiß",
    carbsLabel: "Kohlenhydrate",
    fatLabel: "Fett",
    more: "mehr",
    
    // Premium Page
    premiumActive: "Premium Aktiv",
    renewsOn: "Erneuert am",
    manage: "Verwalten",
    overview: "Übersicht",
    quickAccess: "Schnellzugriff",
    setupTrackerButton: "Tracker einrichten",
    yourPremiumFeatures: "Deine Premium-Features",
    weeklyPersonalizedMealPlans: "Wöchentliche personalisierte Meal Plans",
    automaticShoppingLists: "Automatische Einkaufslisten",
    macroTrackingCalorieAnalysis: "Makro-Tracking & Kalorienanalyse",
    unlimitedRecipeGeneration: "Unbegrenzte Rezeptgenerierung",
    waterTrackerFeature: "Wasser-Tracker",
    weightProgressFeature: "Gewichtsverlauf & Fortschritt",
    getPremiumNow: "Jetzt Premium werden",
    
    // Shopping List
    shoppingListTitle: "Einkaufsliste",
    ofPurchased: "gekauft",
    spent: "ausgegeben",
    generateMealPlanForList: "Generiere einen Wochenplan um die Einkaufsliste zu sehen",
    
    // AI Chatbot
    aiAdvisor: "FrigBuddy Berater",
    yourNutritionExpert: "Dein Ernährungsexperte",
    helloImAI: "Hallo! Ich bin dein KI-Assistent.",
    askAboutRecipes: "Frag mich nach Rezepten, App-Hilfe oder sage \"Tracker zurücksetzen\"!",
    yourGoalLabel: "Dein Ziel",
    askMeSomething: "Frag mich etwas...",
    trackerReset: "Tracker zurückgesetzt",
    goalsReset: "Deine Ziele wurden zurückgesetzt. Du kannst sie jetzt neu einrichten.",
    couldNotProcess: "Entschuldigung, ich konnte deine Anfrage nicht verarbeiten. Bitte versuche es erneut.",
    
    // Session expired
    sessionExpired: "Sitzung abgelaufen",
    pleaseLoginAgain: "Bitte melde dich erneut an.",
    redirectingToStripe: "Du wirst jetzt weitergeleitet...",
    noCheckoutUrl: "Keine Checkout-URL erhalten",
    noPortalUrl: "Keine Portal-URL erhalten",
    
    // MacroTracker specific
    nothingEatenToday: "Noch nichts gegessen heute",
    addFirstFood: "Füge dein erstes Essen hinzu",
    egTwoEggsWithToast: "z.B. 2 Eier mit Toast",
    takePhoto: "Foto aufnehmen",
    scanBarcode: "Barcode scannen",
    letsGo: "Los geht's!",
    
    // Language Settings
    languageSettings: "Spracheinstellungen",
    changeLanguage: "Sprache ändern",
    german: "Deutsch",
    english: "Englisch",
    french: "Französisch",
  },
  en: {
    // Navigation & Common
    login: "Sign In",
    logout: "Sign Out",
    favorites: "Favorites",
    mealPlans: "Meal Plans",
    shoppingList: "Shopping List",
    tracker: "Tracker",
    water: "Water",
    stats: "Statistics",
    premium: "Premium",
    settings: "Settings",
    manageSubscription: "Manage Subscription",
    cancelSubscription: "Cancel Subscription",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    next: "Next",
    back: "Back",
    skip: "Skip",
    start: "Let's go",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    or: "Or",
    
    // Home Page
    homeTitle: "Easier Weight Loss",
    homeSubtitle: "Scan fridge • Set tracker • Enjoy diet recipes",
    scanFridge: "Scan Fridge",
    scansRemaining: "scans left today",
    unlimitedWithPremium: "Unlimited with Premium",
    tip: "Tip",
    tipText: "Scan your fridge and instantly get low-calorie recipes with only 3-4 ingredients.",
    dailyGoal: "Your Daily Goal",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    unlockPremium: "Unlock Premium",
    premiumFeatures: "Tracker • Meal Plans • Shopping Lists",
    perMonth: "/month",
    signInForFeatures: "Sign in for all features",
    startNow: "Start Now",
    
    // Scanner
    barcodeScanner: "Scan Barcode",
    productRecognized: "Product recognized!",
    productNotFound: "Product not found",
    barcodeNotInDatabase: "This barcode is not in the database.",
    productSearching: "Searching for product...",
    cameraAccessDenied: "Camera access denied. Please allow access.",
    noCameraFound: "No camera found.",
    cameraError: "Camera could not be started.",
    tryAgain: "Try again",
    instantRecognition: "⚡ Instant recognition active",
    safariMode: "Safari mode",
    analyzingFood: "Analyzing your food...",
    
    // Onboarding
    selectLanguage: "Select language",
    onboardingSlide1Title: "Welcome!",
    onboardingSlide1Subtitle: "Your smart fridge assistant",
    onboardingSlide2Title: "Scan fridge",
    onboardingSlide2Subtitle: "Take a photo of your fridge",
    onboardingSlide3Title: "AI analyzes",
    onboardingSlide3Subtitle: "Automatically recognizes all ingredients",
    onboardingSlide4Title: "Get recipes",
    onboardingSlide4Subtitle: "Low-calorie recipes with just 3-4 ingredients",
    onboardingSlide5Title: "Track progress",
    onboardingSlide5Subtitle: "Keep your calories in check",
    onboardingSlide6Title: "Lose weight easier",
    onboardingSlide6Subtitle: "Reach your goal weight",
    // New onboarding slides 7-14
    onboardingSlide7Title: "Health Sync",
    onboardingSlide7Subtitle: "Connect your health data",
    onboardingSlide8Title: "Community",
    onboardingSlide8Subtitle: "Share recipes & connect",
    onboardingSlide9Title: "Over 10,000 happy users",
    onboardingSlide10Title: "How did you hear about us?",
    onboardingSlide11Title: "What is your main goal?",
    onboardingSlide12Title: "How often do you cook?",
    onboardingSlide13Title: "What is your biggest challenge?",
    onboardingSlide14Title: "You're ready! 🎉",
    // Health Sync options
    healthSyncTitle: "Enable Health Sync?",
    healthSyncSubtitle: "Automatically sync weight & activities",
    connectAppleHealth: "Connect Apple Health",
    connectGoogleFit: "Connect Google Fit",
    skipForNow: "Set up later",
    communityTitle: "Join Community?",
    communitySubtitle: "Share recipes and motivate others",
    joinCommunity: "Join Community",
    maybeLater: "Maybe later",
    // Question options
    howDidYouHear: "How did you hear about us?",
    optionTikTok: "TikTok",
    optionYouTube: "YouTube",
    optionInstagram: "Instagram",
    optionFriends: "Friends",
    optionOther: "Other",
    whatIsYourMainGoal: "What is your main goal?",
    goalLoseWeight: "Lose weight",
    goalEatHealthier: "Eat healthier",
    goalSaveTime: "Save time",
    goalLearnCooking: "Learn cooking",
    howOftenCook: "How often do you cook?",
    cookDaily: "Daily",
    cookFewTimes: "A few times a week",
    cookRarely: "Rarely",
    cookNever: "Almost never",
    biggestChallenge: "What is your biggest challenge?",
    challengeNoIdeas: "No recipe ideas",
    challengeNoTime: "No time to cook",
    challengeCalories: "Counting calories",
    challengeIngredients: "Wasting ingredients",
    recipe: "Recipe",
    ingredients: "ingredients",
    
    // Plan Selection
    choosePlan: "Choose your plan",
    freePlan: "Free",
    freePlanDesc: "Perfect for trying out",
    freeFeature1: "2 fridge scans per day",
    freeFeature2: "Basic recipe suggestions",
    freeFeature3: "Calorie display",
    premiumPlan: "Premium",
    premiumPlanDesc: "Everything you need to lose weight",
    premiumFeature1: "Unlimited fridge scans",
    premiumFeature2: "AI chatbot for nutrition questions",
    premiumFeature3: "Personalized weekly meal plans",
    premiumFeature4: "Automatic shopping lists",
    premiumFeature5: "Macro & calorie tracker",
    premiumFeature6: "Water tracker with reminders",
    premiumFeature7: "Weight progress & statistics",
    freeTrialInfo: "1 week free trial, then €4.99/month",
    continueWithFree: "Start free",
    startFreeTrial: "Start 1 week free trial",
    
    // Auth
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    signIn: "Sign In",
    signUp: "Sign Up",
    signInWithGoogle: "Sign in with Google",
    noAccount: "No account yet? Sign up now",
    alreadyHaveAccount: "Already have an account? Sign in",
    forgotPassword: "Forgot password?",
    
    // Tracker
    age: "Age",
    years: "years",
    weight: "Weight",
    kg: "kg",
    targetWeight: "Target Weight",
    setupTracker: "Set up Tracker",
    caloriesPerDay: "Calories per day",
    addFood: "Add food",
    eaten: "Eaten",
    kcalLeft: "kcal left",
    today: "Today",
    changeGoal: "Change goal",
    howOldAreYou: "How old are you?",
    howMuchDoYouWeigh: "How much do you weigh?",
    whatIsYourGoalIn4Weeks: "What is your goal in 4 weeks?",
    loseWeight: "lose",
    yourPersonalPlan: "Your personal plan",
    baseMetabolism: "Base metabolism",
    withActivity: "With activity",
    deficit: "Deficit",
    goal: "Goal",
    inWeeks: "in 4 weeks",
    weeklyRate: "/week",
    calorieGoalSet: "Calorie goal set to",
    forYourHealth: "for your health.",
    foodAdded: "Food added",
    entryUpdated: "Entry updated",
    couldNotAnalyzeFood: "Could not analyze food",
    patienceMessage: "Thanks for your patience...",
    calculatingCalories: "Calculating calories...",
    determiningNutrients: "Determining nutrients...",
    almostDone: "Almost done...",
    
    // Meal Plans
    weeklyPlan: "Weekly Plan",
    generateNewPlan: "Create New Plan",
    breakfast: "Breakfast",
    morningSnack: "Snack",
    lunch: "Lunch",
    afternoonSnack: "Snack",
    dinner: "Dinner",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    newPlanGenerated: "New weekly plan generated!",
    planWithKcal: "Plan with {kcal} kcal/day created.",
    couldNotGeneratePlan: "Could not generate meal plan",
    setupTrackerFirst: "Please set up your tracker first",
    reminderSettings: "Reminders",
    
    // Water Tracker
    waterTracker: "Water Tracker",
    addGlass: "Add Glass",
    glasses: "glasses",
    glassesOf: "glasses of",
    waterGoal: "Water Goal",
    waterAdded: "+250ml drank!",
    goalReached: "Goal reached!",
    dailyGoalReached: "Daily goal reached!",
    wellDone: "Well done!",
    setDailyGoal: "Set daily goal",
    perDay: "per day",
    goalSaved: "Goal saved",
    ofGoal: "of",
    
    // Progress & Stats
    progressTracker: "Progress",
    weightProgress: "Weight Progress",
    addWeight: "Add Weight",
    noDataYet: "No data yet",
    current: "Current",
    lost: "Lost",
    progressToGoal: "Progress to goal",
    goalAchieved: "Goal achieved!",
    invalidWeight: "Invalid weight",
    weightAdded: "Weight added!",
    
    // Toasts
    toastProductAdded: "added to tracker",
    toastFoodLogged: "Food logged",
    toastWaterAdded: "Water added",
    toastGoalReached: "Goal reached!",
    toastError: "An error occurred",
    toastSuccess: "Successfully saved",
    notLoggedIn: "Not logged in",
    loadingStripePortal: "Loading Stripe portal...",
    pleaseWait: "Please wait",
    
    // Bottom Navigation
    navMealPlan: "Meal Plan",
    navShopping: "Shopping",
    navTracker: "Tracker",
    navWater: "Water",
    navStats: "Stats",
    
    // Snack
    snack: "Snack",
    
    // Scan Page
    scanTitle: "Scan Fridge",
    uploadPhoto: "Upload Photo",
    takePhotoOrSelect: "Take a photo of your fridge or select an image",
    selectImage: "Select Image",
    ingredientsRecognized: "Ingredients recognized!",
    ingredientsFound: "ingredients found",
    couldNotAnalyze: "Could not analyze image. Please try again.",
    newPhoto: "New Photo",
    generateRecipes: "Generate Recipes",
    dailyScanLimitReached: "Daily Scan Limit Reached",
    usedScansToday: "You have already used 2 scans today. Get unlimited scans with Premium!",
    upgradeToPremium: "Upgrade to Premium",
    unlimited: "Unlimited",
    loginRequired: "Login Required",
    loginToUseScanner: "Please sign in to use the scanner.",
    scanLimitReached: "Scan limit reached",
    aiAnalyzingIngredients: "AI is analyzing your ingredients...",
    
    // Recipes Page
    yourRecipes: "Your Recipes",
    regenerate: "Regenerate",
    aiCreatingRecipes: "AI is creating your recipes",
    momentPlease: "Just a moment...",
    noRecipesFound: "No recipes found. Try with other ingredients.",
    tryOtherIngredients: "Try with other ingredients",
    backToStart: "Back to Start",
    recipesGenerated: "Recipes generated!",
    healthyRecipesFound: "healthy recipes found for you.",
    
    // Favorites
    myFavorites: "My Favorites",
    noFavoritesYet: "No favorites yet",
    saveFavoriteRecipes: "Save your favorite recipes to find them later",
    discoverRecipes: "Discover Recipes",
    
    // Recipe Card
    proteinLabel: "Protein",
    carbsLabel: "Carbohydrates",
    fatLabel: "Fat",
    more: "more",
    
    // Premium Page
    premiumActive: "Premium Active",
    renewsOn: "Renews on",
    manage: "Manage",
    overview: "Overview",
    quickAccess: "Quick Access",
    setupTrackerButton: "Set up Tracker",
    yourPremiumFeatures: "Your Premium Features",
    weeklyPersonalizedMealPlans: "Weekly personalized meal plans",
    automaticShoppingLists: "Automatic shopping lists",
    macroTrackingCalorieAnalysis: "Macro tracking & calorie analysis",
    unlimitedRecipeGeneration: "Unlimited recipe generation",
    waterTrackerFeature: "Water tracker",
    weightProgressFeature: "Weight progress & tracking",
    getPremiumNow: "Get Premium Now",
    
    // Shopping List
    shoppingListTitle: "Shopping List",
    ofPurchased: "purchased",
    spent: "spent",
    generateMealPlanForList: "Generate a meal plan to see the shopping list",
    
    // AI Chatbot
    aiAdvisor: "FrigBuddy Advisor",
    yourNutritionExpert: "Your nutrition expert",
    helloImAI: "Hello! I am your AI assistant.",
    askAboutRecipes: "Ask me about recipes, app help, or say \"reset tracker\"!",
    yourGoalLabel: "Your goal",
    askMeSomething: "Ask me something...",
    trackerReset: "Tracker reset",
    goalsReset: "Your goals have been reset. You can now set them up again.",
    couldNotProcess: "Sorry, I could not process your request. Please try again.",
    
    // Session expired
    sessionExpired: "Session expired",
    pleaseLoginAgain: "Please sign in again.",
    redirectingToStripe: "Redirecting you now...",
    noCheckoutUrl: "No checkout URL received",
    noPortalUrl: "No portal URL received",
    
    // MacroTracker specific
    nothingEatenToday: "Nothing eaten today",
    addFirstFood: "Add your first food",
    egTwoEggsWithToast: "e.g. 2 eggs with toast",
    takePhoto: "Take photo",
    scanBarcode: "Scan barcode",
    letsGo: "Let's go!",
    
    // Language Settings
    languageSettings: "Language Settings",
    changeLanguage: "Change language",
    german: "German",
    english: "English",
    french: "French",
  },
  fr: {
    // Navigation & Common
    login: "Connexion",
    logout: "Déconnexion",
    favorites: "Favoris",
    mealPlans: "Plans de repas",
    shoppingList: "Liste de courses",
    tracker: "Suivi",
    water: "Eau",
    stats: "Statistiques",
    premium: "Premium",
    settings: "Paramètres",
    manageSubscription: "Gérer l'abonnement",
    cancelSubscription: "Annuler l'abonnement",
    save: "Enregistrer",
    cancel: "Annuler",
    close: "Fermer",
    next: "Suivant",
    back: "Retour",
    skip: "Passer",
    start: "C'est parti",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    or: "Ou",
    
    // Home Page
    homeTitle: "Perdre du poids facilement",
    homeSubtitle: "Scanner le frigo • Configurer le suivi • Profiter des recettes",
    scanFridge: "Scanner le frigo",
    scansRemaining: "scans restants aujourd'hui",
    unlimitedWithPremium: "Illimité avec Premium",
    tip: "Astuce",
    tipText: "Scannez votre frigo et obtenez instantanément des recettes légères avec seulement 3-4 ingrédients.",
    dailyGoal: "Votre objectif quotidien",
    protein: "Protéines",
    carbs: "Glucides",
    fat: "Lipides",
    unlockPremium: "Débloquer Premium",
    premiumFeatures: "Suivi • Plans de repas • Listes de courses",
    perMonth: "/mois",
    signInForFeatures: "Connectez-vous pour toutes les fonctionnalités",
    startNow: "Commencer",
    
    // Scanner
    barcodeScanner: "Scanner le code-barres",
    productRecognized: "Produit reconnu!",
    productNotFound: "Produit non trouvé",
    barcodeNotInDatabase: "Ce code-barres n'est pas dans la base de données.",
    productSearching: "Recherche du produit...",
    cameraAccessDenied: "Accès à la caméra refusé. Veuillez autoriser l'accès.",
    noCameraFound: "Aucune caméra trouvée.",
    cameraError: "Impossible de démarrer la caméra.",
    tryAgain: "Réessayer",
    instantRecognition: "⚡ Reconnaissance instantanée active",
    safariMode: "Mode Safari",
    analyzingFood: "Analyse de votre nourriture...",
    
    // Onboarding
    selectLanguage: "Choisir la langue",
    onboardingSlide1Title: "Bienvenue!",
    onboardingSlide1Subtitle: "Votre assistant frigo intelligent",
    onboardingSlide2Title: "Scanner le frigo",
    onboardingSlide2Subtitle: "Prenez une photo de votre frigo",
    onboardingSlide3Title: "L'IA analyse",
    onboardingSlide3Subtitle: "Reconnaît automatiquement tous les ingrédients",
    onboardingSlide4Title: "Obtenir des recettes",
    onboardingSlide4Subtitle: "Recettes légères avec seulement 3-4 ingrédients",
    onboardingSlide5Title: "Suivre les progrès",
    onboardingSlide5Subtitle: "Gardez un œil sur vos calories",
    onboardingSlide6Title: "Perdre du poids facilement",
    onboardingSlide6Subtitle: "Atteignez votre poids idéal",
    // New onboarding slides 7-14
    onboardingSlide7Title: "Health Sync",
    onboardingSlide7Subtitle: "Connectez vos données de santé",
    onboardingSlide8Title: "Communauté",
    onboardingSlide8Subtitle: "Partagez des recettes et connectez-vous",
    onboardingSlide9Title: "Plus de 10 000 utilisateurs satisfaits",
    onboardingSlide10Title: "Comment avez-vous entendu parler de nous?",
    onboardingSlide11Title: "Quel est votre objectif principal?",
    onboardingSlide12Title: "À quelle fréquence cuisinez-vous?",
    onboardingSlide13Title: "Quel est votre plus grand défi?",
    onboardingSlide14Title: "Vous êtes prêt! 🎉",
    // Health Sync options
    healthSyncTitle: "Activer Health Sync?",
    healthSyncSubtitle: "Synchronisez automatiquement poids et activités",
    connectAppleHealth: "Connecter Apple Health",
    connectGoogleFit: "Connecter Google Fit",
    skipForNow: "Configurer plus tard",
    communityTitle: "Rejoindre la communauté?",
    communitySubtitle: "Partagez des recettes et motivez les autres",
    joinCommunity: "Rejoindre la communauté",
    maybeLater: "Peut-être plus tard",
    // Question options
    howDidYouHear: "Comment avez-vous entendu parler de nous?",
    optionTikTok: "TikTok",
    optionYouTube: "YouTube",
    optionInstagram: "Instagram",
    optionFriends: "Amis",
    optionOther: "Autre",
    whatIsYourMainGoal: "Quel est votre objectif principal?",
    goalLoseWeight: "Perdre du poids",
    goalEatHealthier: "Manger plus sainement",
    goalSaveTime: "Gagner du temps",
    goalLearnCooking: "Apprendre à cuisiner",
    howOftenCook: "À quelle fréquence cuisinez-vous?",
    cookDaily: "Tous les jours",
    cookFewTimes: "Quelques fois par semaine",
    cookRarely: "Rarement",
    cookNever: "Presque jamais",
    biggestChallenge: "Quel est votre plus grand défi?",
    challengeNoIdeas: "Pas d'idées de recettes",
    challengeNoTime: "Pas de temps pour cuisiner",
    challengeCalories: "Compter les calories",
    challengeIngredients: "Gaspiller les ingrédients",
    recipe: "Recette",
    ingredients: "ingrédients",
    
    // Plan Selection
    choosePlan: "Choisissez votre plan",
    freePlan: "Gratuit",
    freePlanDesc: "Parfait pour essayer",
    freeFeature1: "2 scans de frigo par jour",
    freeFeature2: "Suggestions de recettes de base",
    freeFeature3: "Affichage des calories",
    premiumPlan: "Premium",
    premiumPlanDesc: "Tout ce dont vous avez besoin pour perdre du poids",
    premiumFeature1: "Scans de frigo illimités",
    premiumFeature2: "Chatbot IA pour les questions nutrition",
    premiumFeature3: "Plans de repas personnalisés",
    premiumFeature4: "Listes de courses automatiques",
    premiumFeature5: "Suivi des macros et calories",
    premiumFeature6: "Suivi de l'eau avec rappels",
    premiumFeature7: "Progression du poids et statistiques",
    freeTrialInfo: "1 semaine gratuite, puis €4,99/mois",
    continueWithFree: "Commencer gratuitement",
    startFreeTrial: "Essayer 1 semaine gratuite",
    
    // Auth
    email: "E-mail",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    signIn: "Connexion",
    signUp: "Inscription",
    signInWithGoogle: "Se connecter avec Google",
    noAccount: "Pas encore de compte? Inscrivez-vous",
    alreadyHaveAccount: "Déjà un compte? Connectez-vous",
    forgotPassword: "Mot de passe oublié?",
    
    // Tracker
    age: "Âge",
    years: "ans",
    weight: "Poids",
    kg: "kg",
    targetWeight: "Poids cible",
    setupTracker: "Configurer le suivi",
    caloriesPerDay: "Calories par jour",
    addFood: "Ajouter un aliment",
    eaten: "Mangé",
    kcalLeft: "kcal restantes",
    today: "Aujourd'hui",
    changeGoal: "Modifier l'objectif",
    howOldAreYou: "Quel âge avez-vous?",
    howMuchDoYouWeigh: "Combien pesez-vous?",
    whatIsYourGoalIn4Weeks: "Quel est votre objectif en 4 semaines?",
    loseWeight: "perdre",
    yourPersonalPlan: "Votre plan personnel",
    baseMetabolism: "Métabolisme de base",
    withActivity: "Avec activité",
    deficit: "Déficit",
    goal: "Objectif",
    inWeeks: "en 4 semaines",
    weeklyRate: "/semaine",
    calorieGoalSet: "Objectif calorique fixé à",
    forYourHealth: "pour votre santé.",
    foodAdded: "Aliment ajouté",
    entryUpdated: "Entrée mise à jour",
    couldNotAnalyzeFood: "Impossible d'analyser l'aliment",
    patienceMessage: "Merci pour votre patience...",
    calculatingCalories: "Calcul des calories...",
    determiningNutrients: "Détermination des nutriments...",
    almostDone: "Presque terminé...",
    
    // Meal Plans
    weeklyPlan: "Plan de la semaine",
    generateNewPlan: "Créer un nouveau plan",
    breakfast: "Petit-déjeuner",
    morningSnack: "Collation",
    lunch: "Déjeuner",
    afternoonSnack: "Collation",
    dinner: "Dîner",
    monday: "Lundi",
    tuesday: "Mardi",
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche",
    newPlanGenerated: "Nouveau plan hebdomadaire généré!",
    planWithKcal: "Plan avec {kcal} kcal/jour créé.",
    couldNotGeneratePlan: "Impossible de générer le plan de repas",
    setupTrackerFirst: "Veuillez d'abord configurer votre suivi",
    reminderSettings: "Rappels",
    
    // Water Tracker
    waterTracker: "Suivi d'eau",
    addGlass: "Ajouter un verre",
    glasses: "verres",
    glassesOf: "verres de",
    waterGoal: "Objectif d'eau",
    waterAdded: "+250ml bu!",
    goalReached: "Objectif atteint!",
    dailyGoalReached: "Objectif quotidien atteint!",
    wellDone: "Bien joué!",
    setDailyGoal: "Définir l'objectif quotidien",
    perDay: "par jour",
    goalSaved: "Objectif enregistré",
    ofGoal: "de",
    
    // Progress & Stats
    progressTracker: "Progression",
    weightProgress: "Évolution du poids",
    addWeight: "Ajouter le poids",
    noDataYet: "Pas encore de données",
    current: "Actuel",
    lost: "Perdu",
    progressToGoal: "Progression vers l'objectif",
    goalAchieved: "Objectif atteint!",
    invalidWeight: "Poids invalide",
    weightAdded: "Poids ajouté!",
    
    // Toasts
    toastProductAdded: "ajouté au suivi",
    toastFoodLogged: "Aliment enregistré",
    toastWaterAdded: "Eau ajoutée",
    toastGoalReached: "Objectif atteint!",
    toastError: "Une erreur s'est produite",
    toastSuccess: "Enregistré avec succès",
    notLoggedIn: "Non connecté",
    loadingStripePortal: "Chargement du portail Stripe...",
    pleaseWait: "Veuillez patienter",
    
    // Bottom Navigation
    navMealPlan: "Repas",
    navShopping: "Courses",
    navTracker: "Suivi",
    navWater: "Eau",
    navStats: "Stats",
    
    // Snack
    snack: "Collation",
    
    // Scan Page
    scanTitle: "Scanner le frigo",
    uploadPhoto: "Télécharger une photo",
    takePhotoOrSelect: "Prenez une photo de votre frigo ou sélectionnez une image",
    selectImage: "Sélectionner une image",
    ingredientsRecognized: "Ingrédients reconnus!",
    ingredientsFound: "ingrédients trouvés",
    couldNotAnalyze: "Impossible d'analyser l'image. Veuillez réessayer.",
    newPhoto: "Nouvelle photo",
    generateRecipes: "Générer des recettes",
    dailyScanLimitReached: "Limite de scan quotidienne atteinte",
    usedScansToday: "Vous avez déjà utilisé 2 scans aujourd'hui. Obtenez des scans illimités avec Premium!",
    upgradeToPremium: "Passer à Premium",
    unlimited: "Illimité",
    loginRequired: "Connexion requise",
    loginToUseScanner: "Veuillez vous connecter pour utiliser le scanner.",
    scanLimitReached: "Limite de scan atteinte",
    aiAnalyzingIngredients: "L'IA analyse vos ingrédients...",
    
    // Recipes Page
    yourRecipes: "Vos Recettes",
    regenerate: "Régénérer",
    aiCreatingRecipes: "L'IA crée vos recettes",
    momentPlease: "Un instant s'il vous plaît...",
    noRecipesFound: "Aucune recette trouvée. Essayez avec d'autres ingrédients.",
    tryOtherIngredients: "Essayez avec d'autres ingrédients",
    backToStart: "Retour au début",
    recipesGenerated: "Recettes générées!",
    healthyRecipesFound: "recettes saines trouvées pour vous.",
    
    // Favorites
    myFavorites: "Mes Favoris",
    noFavoritesYet: "Pas encore de favoris",
    saveFavoriteRecipes: "Enregistrez vos recettes préférées pour les retrouver plus tard",
    discoverRecipes: "Découvrir des recettes",
    
    // Recipe Card
    proteinLabel: "Protéines",
    carbsLabel: "Glucides",
    fatLabel: "Lipides",
    more: "plus",
    
    // Premium Page
    premiumActive: "Premium Actif",
    renewsOn: "Renouvellement le",
    manage: "Gérer",
    overview: "Aperçu",
    quickAccess: "Accès rapide",
    setupTrackerButton: "Configurer le suivi",
    yourPremiumFeatures: "Vos fonctionnalités Premium",
    weeklyPersonalizedMealPlans: "Plans de repas personnalisés hebdomadaires",
    automaticShoppingLists: "Listes de courses automatiques",
    macroTrackingCalorieAnalysis: "Suivi des macros & analyse calorique",
    unlimitedRecipeGeneration: "Génération de recettes illimitée",
    waterTrackerFeature: "Suivi d'eau",
    weightProgressFeature: "Évolution du poids & suivi",
    getPremiumNow: "Passer à Premium",
    
    // Shopping List
    shoppingListTitle: "Liste de courses",
    ofPurchased: "acheté",
    spent: "dépensé",
    generateMealPlanForList: "Générez un plan de repas pour voir la liste de courses",
    
    // AI Chatbot
    aiAdvisor: "Conseiller FrigBuddy",
    yourNutritionExpert: "Votre expert en nutrition",
    helloImAI: "Bonjour! Je suis votre assistant IA.",
    askAboutRecipes: "Demandez-moi des recettes, de l'aide sur l'app, ou dites \"réinitialiser le suivi\"!",
    yourGoalLabel: "Votre objectif",
    askMeSomething: "Posez-moi une question...",
    trackerReset: "Suivi réinitialisé",
    goalsReset: "Vos objectifs ont été réinitialisés. Vous pouvez maintenant les reconfigurer.",
    couldNotProcess: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
    
    // Session expired
    sessionExpired: "Session expirée",
    pleaseLoginAgain: "Veuillez vous reconnecter.",
    redirectingToStripe: "Redirection en cours...",
    noCheckoutUrl: "Aucune URL de paiement reçue",
    noPortalUrl: "Aucune URL de portail reçue",
    
    // MacroTracker specific
    nothingEatenToday: "Rien mangé aujourd'hui",
    addFirstFood: "Ajoutez votre premier aliment",
    egTwoEggsWithToast: "ex. 2 œufs avec toast",
    takePhoto: "Prendre une photo",
    scanBarcode: "Scanner le code-barres",
    letsGo: "C'est parti!",
    
    // Language Settings
    languageSettings: "Paramètres de langue",
    changeLanguage: "Changer de langue",
    german: "Allemand",
    english: "Anglais",
    french: "Français",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "de";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  useEffect(() => {
    const saved = localStorage.getItem("app-language");
    if (saved && ["de", "en", "fr"].includes(saved)) {
      setLanguageState(saved as Language);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
