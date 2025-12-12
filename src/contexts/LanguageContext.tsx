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
  recipe: string;
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
  weight: string;
  targetWeight: string;
  setupTracker: string;
  caloriesPerDay: string;
  addFood: string;
  eaten: string;
  kcalLeft: string;
  
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
  
  // Water Tracker
  addGlass: string;
  glassesOf: string;
  waterGoal: string;
  waterAdded: string;
  goalReached: string;
  
  // Toasts
  toastProductAdded: string;
  toastFoodLogged: string;
  toastWaterAdded: string;
  toastGoalReached: string;
  toastError: string;
  toastSuccess: string;
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
    onboardingSlide1Title: "Was essen?",
    onboardingSlide1Subtitle: "Keine Idee beim Kühlschrank?",
    onboardingSlide2Title: "Scannen",
    onboardingSlide2Subtitle: "Foto vom Kühlschrank machen",
    onboardingSlide3Title: "Fertig!",
    onboardingSlide3Subtitle: "Kalorienarme Rezepte erhalten",
    recipe: "Rezept",
    ingredients: "Zutaten",
    
    // Auth
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    signIn: "Anmelden",
    signUp: "Registrieren",
    signInWithGoogle: "Mit Google anmelden",
    noAccount: "Noch kein Konto?",
    alreadyHaveAccount: "Bereits ein Konto?",
    forgotPassword: "Passwort vergessen?",
    
    // Tracker
    age: "Alter",
    weight: "Gewicht",
    targetWeight: "Zielgewicht",
    setupTracker: "Tracker einrichten",
    caloriesPerDay: "Kalorien pro Tag",
    addFood: "Essen hinzufügen",
    eaten: "Gegessen",
    kcalLeft: "kcal übrig",
    
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
    
    // Water Tracker
    addGlass: "Glas hinzufügen",
    glassesOf: "Gläser von",
    waterGoal: "Wasserziel",
    waterAdded: "+250ml getrunken!",
    goalReached: "Tagesziel erreicht!",
    
    // Toasts
    toastProductAdded: "zum Tracker hinzugefügt",
    toastFoodLogged: "Essen erfasst",
    toastWaterAdded: "Wasser hinzugefügt",
    toastGoalReached: "Ziel erreicht!",
    toastError: "Ein Fehler ist aufgetreten",
    toastSuccess: "Erfolgreich gespeichert",
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
    onboardingSlide1Title: "What to eat?",
    onboardingSlide1Subtitle: "No idea at the fridge?",
    onboardingSlide2Title: "Scan",
    onboardingSlide2Subtitle: "Take a photo of your fridge",
    onboardingSlide3Title: "Done!",
    onboardingSlide3Subtitle: "Get low-calorie recipes",
    recipe: "Recipe",
    ingredients: "ingredients",
    
    // Auth
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    signIn: "Sign In",
    signUp: "Sign Up",
    signInWithGoogle: "Sign in with Google",
    noAccount: "No account yet?",
    alreadyHaveAccount: "Already have an account?",
    forgotPassword: "Forgot password?",
    
    // Tracker
    age: "Age",
    weight: "Weight",
    targetWeight: "Target Weight",
    setupTracker: "Set up Tracker",
    caloriesPerDay: "Calories per day",
    addFood: "Add food",
    eaten: "Eaten",
    kcalLeft: "kcal left",
    
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
    
    // Water Tracker
    addGlass: "Add Glass",
    glassesOf: "glasses of",
    waterGoal: "Water Goal",
    waterAdded: "+250ml drank!",
    goalReached: "Daily goal reached!",
    
    // Toasts
    toastProductAdded: "added to tracker",
    toastFoodLogged: "Food logged",
    toastWaterAdded: "Water added",
    toastGoalReached: "Goal reached!",
    toastError: "An error occurred",
    toastSuccess: "Successfully saved",
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
    onboardingSlide1Title: "Quoi manger?",
    onboardingSlide1Subtitle: "Pas d'idée devant le frigo?",
    onboardingSlide2Title: "Scanner",
    onboardingSlide2Subtitle: "Prendre une photo du frigo",
    onboardingSlide3Title: "Terminé!",
    onboardingSlide3Subtitle: "Obtenir des recettes légères",
    recipe: "Recette",
    ingredients: "ingrédients",
    
    // Auth
    email: "E-mail",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    signIn: "Connexion",
    signUp: "Inscription",
    signInWithGoogle: "Se connecter avec Google",
    noAccount: "Pas encore de compte?",
    alreadyHaveAccount: "Déjà un compte?",
    forgotPassword: "Mot de passe oublié?",
    
    // Tracker
    age: "Âge",
    weight: "Poids",
    targetWeight: "Poids cible",
    setupTracker: "Configurer le suivi",
    caloriesPerDay: "Calories par jour",
    addFood: "Ajouter un aliment",
    eaten: "Mangé",
    kcalLeft: "kcal restantes",
    
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
    
    // Water Tracker
    addGlass: "Ajouter un verre",
    glassesOf: "verres de",
    waterGoal: "Objectif d'eau",
    waterAdded: "+250ml bu!",
    goalReached: "Objectif atteint!",
    
    // Toasts
    toastProductAdded: "ajouté au suivi",
    toastFoodLogged: "Aliment enregistré",
    toastWaterAdded: "Eau ajoutée",
    toastGoalReached: "Objectif atteint!",
    toastError: "Une erreur s'est produite",
    toastSuccess: "Enregistré avec succès",
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
