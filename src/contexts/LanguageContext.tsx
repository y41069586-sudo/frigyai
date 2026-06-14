import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { dispatchLanguageChanged } from "@/lib/mealPlanLanguage";
import {
  extendedTranslations,
  type ExtendedTranslations,
  formatTranslation,
} from "./translationsExtended";

export type Language = "de" | "en" | "fr";
export { formatTranslation };

export interface Translations extends ExtendedTranslations {
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
  
  // Onboarding Steps
  onboardingWhatsYourName: string;
  onboardingNameSubtitle: string;
  onboardingYourName: string;
  onboardingImFrigy: string;
  onboardingReadyToReachGoals: string;
  onboardingYesLetsGo: string;
  onboardingWhatsYourGoal: string;
  onboardingSelectToPersonalize: string;
  onboardingLoseWeight: string;
  onboardingMaintainWeight: string;
  onboardingGainMuscle: string;
  onboardingEatHealthier: string;
  onboardingLovedByThousands: string;
  onboardingJoinUsers: string;
  onboardingRealResults: string;
  onboardingBasedOnData: string;
  onboardingLongTermResults: string;
  onboardingComparisonSubtitle: string;
  onboardingMaintainWeightLoss: string;
  onboardingReadyToStart: string;
  onboardingReachGoals: string;
  onboardingAvgWeightLoss: string;
  onboardingTimeSaved: string;
  onboardingTimeToPersonalize: string;
  onboardingQuickSteps: string;
  onboardingBody: string;
  onboardingActivity: string;
  onboardingMacros: string;
  onboardingTakesLess30Sec: string;
  onboardingYourBodyData: string;
  onboardingScrollToSet: string;
  onboardingHeight: string;
  onboardingWeightLabel: string;
  onboardingAgeLabel: string;
  onboardingPrivate: string;
  onboardingYourGender: string;
  onboardingGenderImportant: string;
  onboardingMale: string;
  onboardingFemale: string;
  onboardingYourGoalMode: string;
  onboardingWhatDirection: string;
  onboardingLoseWeightMode: string;
  onboardingGainWeightMode: string;
  onboardingTargetWeight: string;
  onboardingGoalIn: string;
  onboardingWeeks: string;
  onboardingYourSpeed: string;
  onboardingHowFast: string;
  onboardingSlow: string;
  onboardingGentle: string;
  onboardingModerate: string;
  onboardingSteady: string;
  onboardingFast: string;
  onboardingAmbitious: string;
  onboardingIntense: string;
  onboardingMaximum: string;
  onboardingHighTempoWarning: string;
  onboardingRecommendedTempo: string;
  onboardingDietaryPrefs: string;
  onboardingForMatchingRecipes: string;
  onboardingVegetarian: string;
  onboardingNoMeatFish: string;
  onboardingVegan: string;
  onboardingNoAnimalProducts: string;
  onboardingPescatarian: string;
  onboardingFishNoMeat: string;
  onboardingNone: string;
  onboardingEverythingAllowed: string;
  onboardingAllergies: string;
  onboardingMultiSelect: string;
  onboardingGluten: string;
  onboardingLactose: string;
  onboardingNuts: string;
  onboardingSoy: string;
  onboardingEggs: string;
  onboardingCookingExperience: string;
  onboardingForRecipeDifficulty: string;
  onboardingBeginner: string;
  onboardingSimpleRecipes: string;
  onboardingIntermediate: string;
  onboardingMediumDishes: string;
  onboardingAdvanced: string;
  onboardingDemandingCuisine: string;
  onboardingActivityLevel: string;
  onboardingHowActive: string;
  onboardingChill: string;
  onboardingDeskJob: string;
  onboardingActive: string;
  onboardingRegularWorkouts: string;
  onboardingBeast: string;
  onboardingIntenseTraining: string;
  onboardingAnalyzingGoals: string;
  onboardingProcessingBodyData: string;
  onboardingCalculatingTargetWeight: string;
  onboardingDeterminingMacros: string;
  onboardingCreatingPlan: string;
  onboardingYourDailyGoal: string;
  onboardingPersonalizedForYou: string;
  onboardingBasedOnScience: string;
  onboardingMifflinFormula: string;
  onboardingBMRCalculation: string;
  onboardingTDEEFactors: string;
  onboardingTotalEnergy: string;
  onboardingProteinRecommendation: string;
  onboardingISSNProtein: string;
  onboardingDeficitRule: string;
  onboardingEnergyBalance: string;
  onboardingLetFridgeDecide: string;
  onboardingBuildMealsFromWhat: string;
  onboardingIllHandlePlanning: string;
  onboardingScanFridgeNow: string;
  onboardingEnableCamera: string;
  onboardingRequiredForScanning: string;
  onboardingCameraAccess: string;
  onboardingForFridgeScanning: string;
  onboardingAllow: string;
  onboardingOptionalHealthSync: string;
  onboardingYourWeeklyPlan: string;
  onboardingPersonalizedMealPlan: string;
  onboardingWithoutFrigy: string;
  onboardingWithFrigy: string;
  onboardingNoStructure: string;
  onboardingRandomMeals: string;
  onboardingClearPlan: string;
  onboardingSuccessRate: string;
  onboardingGoalAchievement: string;
  onboardingFaster: string;
  onboardingSavedPerDay: string;
  onboardingUsersFaster: string;
  onboardingYourTransformation: string;
  onboardingWhatToExpect: string;
  onboardingMoreEnergy: string;
  // How it works step
  onboardingHowItWorks: string;
  onboardingHowItWorksSubtitle: string;
  onboardingHowItWorksStep1Title: string;
  onboardingHowItWorksStep1Desc: string;
  onboardingHowItWorksStep2Title: string;
  onboardingHowItWorksStep2Desc: string;
  onboardingHowItWorksStep3Title: string;
  onboardingHowItWorksStep3Desc: string;
  onboardingHowItWorksTip: string;
  
  // Tutorial transition step
  onboardingPerfect: string;
  onboardingIKnowWhatYouWant: string;
  onboardingLetMeShowYou: string;
  onboardingShowMeHow: string;
  
  // Tutorial steps (multi-page explanation)
  tutorialIntroTitle: string;
  tutorialIntroSubtitle: string;
  tutorialIntroDesc: string;
  tutorialScanTitle: string;
  tutorialScanStep: string;
  tutorialScanDesc1: string;
  tutorialScanDesc2: string;
  tutorialScanDesc3: string;
  tutorialRecipesTitle: string;
  tutorialRecipesStep: string;
  tutorialRecipesDesc1: string;
  tutorialRecipesDesc2: string;
  tutorialRecipesDesc3: string;
  tutorialMealplanTitle: string;
  tutorialMealplanStep: string;
  tutorialMealplanDesc1: string;
  tutorialMealplanDesc2: string;
  tutorialMealplanDesc3: string;
  tutorialShoppingTitle: string;
  tutorialShoppingStep: string;
  tutorialShoppingDesc1: string;
  tutorialShoppingDesc2: string;
  tutorialShoppingDesc3: string;
  tutorialCycleTitle: string;
  tutorialCycleStep: string;
  tutorialCycleDesc1: string;
  tutorialCycleHave: string;
  tutorialCycleNeed: string;
  tutorialCycleEat: string;
  tutorialCycleExplain1: string;
  tutorialCycleExplain2: string;
  tutorialCycleExplain3: string;
  tutorialCycleExplain4: string;
  tutorialChatbotTitle: string;
  tutorialChatbotStep: string;
  tutorialChatbotDesc1: string;
  tutorialChatbotDesc2: string;
  tutorialChatbotDesc3: string;
  tutorialChatbotHint: string;
  tutorialPageIndicator: string;
  onboardingSaveProgress: string;
  onboardingCreateAccount: string;
  onboardingSignInToContinue: string;
  onboardingEmailAddress: string;
  onboardingPasswordLabel: string;
  onboardingRegister: string;
  onboardingSignInButton: string;
  onboardingAlreadyRegistered: string;
  onboardingNoAccountYet: string;
  onboardingWhyRegister: string;
  onboardingPlanSaved: string;
  onboardingProgressSynced: string;
  onboardingAccessRecipes: string;
  onboardingAlreadyLoggedIn: string;
  onboardingChooseYourPlan: string;
  onboardingStartFreeOrPremium: string;
  onboardingFree: string;
  onboardingWeeklyPlan1x: string;
  onboardingWaterTrackerFeature: string;
  onboarding2ScansPerDay: string;
  onboardingBasicRecipes: string;
  onboardingPremiumLabel: string;
  onboardingUnlimitedScans: string;
  onboardingUnlimitedMealPlans: string;
  onboardingShoppingLists: string;
  onboardingStatsAndMacros: string;
  onboardingAIChatbot: string;
  onboardingMostPopular: string;
  onboardingFreeTrial7Days: string;
  onboardingContinue: string;
  onboardingJoinCommunity: string;
  onboardingShareRecipes: string;
  onboardingExploreLater: string;
  onboardingYouMadeIt: string;
  onboardingFrigyReady: string;
  onboardingLetsGoContinue: string;
  onboardingSystemReady: string;
  onboardingMacrosStructure: string;
  onboardingToDashboard: string;
  onboardingRegistrationFailed: string;
  onboardingEmailAlreadyRegistered: string;
  onboardingSuccessfullyRegistered: string;
  onboardingProgressSavedMsg: string;
  onboardingLoginFailed: string;
  onboardingWelcomeBack: string;
  onboardingProgressLoaded: string;
  onboardingEnterEmailPassword: string;
  
  // Home Page
  homeTitle: string;
  homeSubtitle: string;
  scanFridge: string;
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
  signInWithApple: string;
  restorePurchases: string;
  redeemPromoCode: string;
  storePromoCodeTitle: string;
  storePromoCodeDescription: string;
  storePromoCodePlaceholder: string;
  storePromoCodeOpenPlay: string;
  storePromoCodePlayHint: string;
  linkAppleAccount: string;
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
  foodNotFound: string;
  patienceMessage: string;
  calculatingCalories: string;
  determiningNutrients: string;
  almostDone: string;
  frigySays: string;
  foodScanPlateTitle: string;
  foodScanAiPowered: string;
  foodScanTryAnotherDish: string;
  foodScanRecognized: string;
  foodScanScanAnother: string;
  foodScanContinue: string;
  foodNotFoodHint: string;
  foodAnalyzeTimeout: string;
  foodPhotoReadError: string;
  foodPhotoProcessError: string;
  noAnalysisData: string;
  gallery: string;
  cameraGalleryHint: string;
  cameraOpenDevHint: string;
  cameraLocalhostHint: string;
  cameraBlockedHint: string;
  cameraNoDeviceGallery: string;
  cameraInUseHint: string;
  cameraLiveUnavailableHint: string;
  cameraUnsupportedHint: string;
  cameraHttpsHint: string;
  cameraStartSlowHint: string;
  cameraPreviewHint: string;
  ingredientsNotRecognizedHint: string;
  ingredientScanAnalyzingTitle: string;
  ingredientsPresentLabel: string;
  ingredientsMissingLabel: string;
  createShoppingListBtn: string;
  addPhotoBtn: string;
  finishScanAnalyzeBtn: string;
  ingredientScanTapShutter: string;
  ingredientScanRetryAction: string;
  
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
  gained: string;
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
  aiAnalyzingIngredients: string;
  /** Kühlschrank-Scan Overlay */
  analyzingFridge: string;
  /** Wochenplan wird nach Scan erstellt */
  creatingWeeklyPlanFromScan: string;
  
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
  noCheckoutUrl: string;
  noPortalUrl: string;
  
  // New Welcome Screen
  welcomeToFrigy: string;
  splashBubbleText: string;
  welcomeSubtitle: string;
  scanYourFridge: string;
  andMuchMore: string;
  getReady: string;
  chooseLanguage: string;
  
  // Email Confirmation
  checkYourEmail: string;
  confirmationEmailSent: string;
  clickLinkToConfirm: string;
  backToLogin: string;
  noEmailReceived: string;
  emailConfirmed: string;
  redirectingToApp: string;
  
  // Meal Plan Generation Overlay
  mealPlanGenerating1: string;
  mealPlanGenerating2: string;
  mealPlanGenerating3: string;
  mealPlanGenerating4: string;
  mealPlanGenerating5: string;
  mealPlanGenerating6: string;
  mealPlanGenerating7: string;
  mealPlanBackgroundHint: string;

  // First weekly plan (post-registration)
  firstWeeklyPlanTitle: string;
  firstWeeklyPlanSubtitle: string;
  firstWeeklyPlanCreateBtn: string;
  firstWeeklyPlanSuccessTitle: string;
  firstWeeklyPlanSuccessSubtitle: string;
  firstWeeklyPlanContinueBtn: string;
  firstWeeklyPlanPerfectBtn: string;
  splashLoginAccountReady: string;
  firstWeeklyPlanFeatureMeals: string;
  firstWeeklyPlanFeatureMacros: string;
  firstWeeklyPlanFeatureShopping: string;
  firstWeeklyPlanStayOnTab: string;
  firstWeeklyPlanPreviewTitle: string;
  firstWeeklyPlanPreviewSubtitle: string;
  
  // Dashboard & Home
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  welcome: string;
  weightHistory: string;
  tapForDetails: string;
  mealPlanReady: string;
  generateMealPlan: string;
  noMealPlanYet: string;
  
  // Profile & Settings
  subscriptionStatus: string;
  subscriptionRefreshed: string;
  freePlanLabel: string;
  deleteAccount: string;
  deleteAccountSoon: string;
  resetOnboarding: string;
  onboardingResetMessage: string;
  legal: string;
  privacyPolicy: string;
  termsOfService: string;
  imprint: string;
  settingsLabel: string;
  reminders: string;
  
  // Food Entry Detail
  mealName: string;
  calories: string;
  kcal: string;
  grams: string;
  saved: string;
  deleted: string;
  errorSaving: string;
  errorDeleting: string;
  entryNotFound: string;
  saving: string;
  
  // MacroTracker Onboarding
  trackerYourBodyData: string;
  trackerScrollToSet: string;
  trackerHeight: string;
  trackerWeight: string;
  trackerAge: string;
  trackerPrivate: string;
  trackerYourGender: string;
  trackerGenderImportant: string;
  trackerMale: string;
  trackerFemale: string;
  trackerCalorieDifference: string;
  trackerHowActive: string;
  trackerForCalories: string;
  trackerLowActive: string;
  trackerLowActiveDesc: string;
  trackerLightActive: string;
  trackerLightActiveDesc: string;
  trackerModerateActive: string;
  trackerModerateActiveDesc: string;
  trackerVeryActive: string;
  trackerVeryActiveDesc: string;
  trackerYourGoal: string;
  trackerLoseOrGain: string;
  trackerLoseWeight: string;
  trackerGainWeight: string;
  trackerCalorieDeficit: string;
  trackerCalorieSurplus: string;
  trackerYourTargetWeight: string;
  trackerHowMuchLose: string;
  trackerHowMuchGain: string;
  trackerCurrent: string;
  trackerGoalLabel: string;
  trackerWeightLoss: string;
  trackerWeightGain: string;
  trackerYourSpeed: string;
  trackerHowFastLose: string;
  trackerHowFastGain: string;
  trackerKgPerWeek: string;
  trackerSlowSustainable: string;
  trackerModerate: string;
  trackerFast: string;
  trackerVeryFast: string;
  trackerHighDiscipline: string;
  trackerRecommended: string;
  trackerYourPlan: string;
  trackerPersonalizedForYou: string;
  trackerYourDailyGoal: string;
  trackerBasedOnScience: string;
  trackerMifflinFormula: string;
  trackerBMRCalc: string;
  trackerTDEEFactors: string;
  trackerTotalEnergy: string;
  trackerProteinRec: string;
  trackerISSNProtein: string;
  trackerDeficitRule: string;
  trackerEnergyBalance: string;
  trackerYearsShort: string;
  
  // Scan Page
  recentlyCooked: string;
  todayLabel: string;
  yesterdayLabel: string;
  min: string;
  continueButton: string;
  
  // Additional translations for full i18n
  cups: string;
  mlPerCup: string;
  orderIngredients: string;
  orderIngredientsTitle: string;
  followingIngredients: string;
  andMore: string;
  recommended: string;
  bringApp: string;
  copyListPasteBring: string;
  copiedForBring: string;
  openBringPaste: string;
  orSearchDelivery: string;
  worldwideDelivery: string;
  yourGoalLabel2: string;
  youWillReach: string;
  onDate: string;
  now: string;
  perWeek: string;
  yourDailyPlan: string;
  tapToAdjust: string;
  dailyGoalLabel: string;
  calculationBasedOn: string;
  bmrCalculation: string;
  totalEnergyExpenditure: string;
  issnProteinRecommendation: string;
  energyBalanceRule: string;
  letFridgeDecide: string;
  weBuildMeals: string;
  iHandlePlanning: string;
  skipForNowBtn: string;
  enableCamera: string;
  requiredForScanning: string;
  cameraAccessLabel: string;
  forFridgeScanning: string;
  allowAccess: string;
  planningWithFrigy: string;
  yourWayToSuccess: string;
  withoutFrigyLabel: string;
  withFrigyLabel: string;
  noStructure: string;
  goalsMissed: string;
  clearPlan: string;
  successRate94: string;
  goalAchievementLabel: string;
  fasterLabel: string;
  savedPerDayLabel: string;
  usersReachGoalsFaster: string;
  yourTransformationLabel: string;
  whatToExpectWithFrigy: string;
  moreEnergyLabel: string;
  timeSavedLabel: string;
  goalSuccessLabel: string;
  saveYourProgress: string;
  orContinueWith: string;
  createAccountToSave: string;
  signInToContinue: string;
  emailAddressPlaceholder: string;
  passwordPlaceholder: string;
  registerBtn: string;
  signInBtn: string;
  alreadyRegisteredSignIn: string;
  noAccountRegister: string;
  whyRegister: string;
  personalizedPlanSaved: string;
  progressSyncedDevices: string;
  accessRecipesMeals: string;
  alreadyLoggedInContinue: string;
  chooseYourPlan: string;
  startFreeOrPremium: string;
  freeLabel: string;
  weeklyPlan1Gen: string;
  waterTrackerLabel: string;
  scansPerDay2: string;
  basicRecipeSuggestions: string;
  premiumLabel2: string;
  unlimitedScansLabel: string;
  unlimitedMealPlanGen: string;
  shoppingListsLabel: string;
  statsMacroTracking: string;
  aiChatbotLabel: string;
  recommendedLabel: string;
  trial7DaysFree: string;
  startWithFree: string;
  continueToPremium: string;
  selectAPlan: string;
  youSelectedFree: string;
  cookWithOthers: string;
  discoverCommunityRecipes: string;
  byUser: string;
  exploreLater: string;
  youMadeIt: string;
  frigyReadyForYou: string;
  letsGoContinue: string;
  systemReady: string;
  macrosStructureLessThinking: string;
  toDashboard: string;
  personalizedOnPrefs: string;
  continueBtn: string;
  perfectBtn: string;
  weekLabel: string;
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
    unlimitedWithPremium: "Unlimited mit Premium",
    tip: "Tipp",
    tipText: "Scanne deinen Kühlschrank und erhalte sofort kalorienarme Rezepte mit nur 3-4 Zutaten.",
    dailyGoal: "Dein Tagesziel",
    protein: "Protein",
    carbs: "Kohlenhydrate",
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
    onboardingSlide7Title: "Wöchentliche Meal Plans",
    onboardingSlide7Subtitle: "KI-Pläne passend zu deinen Zielen",
    onboardingSlide8Title: "Community",
    onboardingSlide8Subtitle: "Teile Rezepte & verbinde dich",
    onboardingSlide9Title: "Über 10.000 zufriedene Nutzer",
    onboardingSlide10Title: "Wie hast du von uns erfahren?",
    onboardingSlide11Title: "Was ist dein Hauptziel?",
    onboardingSlide12Title: "Wie oft kochst du?",
    onboardingSlide13Title: "Was ist deine größte Herausforderung?",
    onboardingSlide14Title: "Du bist bereit! 🎉",
    // Health Sync options
    healthSyncTitle: "Gewicht & Aktivität",
    healthSyncSubtitle: "Trage Gewicht und Schritte in Frigy ein",
    connectAppleHealth: "Gewicht manuell eintragen",
    connectGoogleFit: "Aktivität manuell eintragen",
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
    freeTrialInfo: "3 Tage kostenlos testen",
    continueWithFree: "Kostenlos starten",
    startFreeTrial: "3 Tage gratis testen",
    
    // Auth
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    signIn: "Anmelden",
    signUp: "Registrieren",
    signInWithGoogle: "Mit Google anmelden",
    signInWithApple: "Mit Apple anmelden",
    restorePurchases: "Käufe wiederherstellen",
    redeemPromoCode: "Promo-Code einlösen",
    storePromoCodeTitle: "Google-Play-Promo-Code",
    storePromoCodeDescription:
      "Gib den Code aus der Play Console ein. Wir öffnen die Play-Store-App mit deinem Code — nicht den Browser.",
    storePromoCodePlaceholder: "z. B. FRIGY2026",
    storePromoCodeOpenPlay: "Im Play Store einlösen",
    storePromoCodePlayHint:
      "Wichtig: Dieselbe Google-Adresse wie im Play Store. App muss aus dem Play Store installiert sein. Abo und Code müssen veröffentlicht und aktiv sein.",
    linkAppleAccount: "Apple-Konto verknüpfen",
    noAccount: "Noch kein Konto? Jetzt registrieren",
    alreadyHaveAccount: "Bereits registriert? Jetzt anmelden",
    forgotPassword: "Passwort vergessen?",
    invalidEmail: "Ungültige E-Mail-Adresse",
    passwordTooShort: "Passwort muss mindestens 8 Zeichen lang sein",
    enterEmailAndPassword: "Bitte gib E-Mail und Passwort ein",
    pleaseSelectGoal: "Bitte wähle ein Ziel aus",
    pleaseSelectGender: "Bitte wähle dein Geschlecht aus",
    pleaseSelectActivityLevel: "Bitte wähle dein Aktivitätslevel aus",
    onboardingPleaseLoginToProceed: "Bitte melde dich an, um fortzufahren",

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
    foodNotFound: "Essen nicht gefunden",
    patienceMessage: "Danke für die Geduld...",
    calculatingCalories: "Kalorien werden berechnet...",
    determiningNutrients: "Nährwerte ermitteln...",
    almostDone: "Fast fertig...",
    frigySays: "Frigy sagt",
    foodScanPlateTitle: "Teller wird gescannt.",
    foodScanAiPowered: "KI-gestützt ✨",
    foodScanTryAnotherDish: "Anderes Gericht versuchen",
    foodScanRecognized: "Erfolgreich erkannt!",
    foodScanScanAnother: "Weiteres Gericht",
    foodScanContinue: "Weiter",
    foodNotFoodHint: "Hmm, ich glaube nicht, dass das Essen ist. Versuchen wir es mal mit etwas Essbarem, okay?",
    foodAnalyzeTimeout: "Die Analyse hat zu lange gedauert. Bitte nochmal versuchen.",
    foodPhotoReadError: "Foto konnte nicht gelesen werden. Bitte nochmal aufnehmen.",
    foodPhotoProcessError: "Foto konnte nicht verarbeitet werden. Bitte erneut versuchen.",
    noAnalysisData: "Keine Daten von der Analyse erhalten",
    gallery: "Galerie",
    cameraGalleryHint: " — oder Galerie unten.",
    cameraOpenDevHint: "Öffne die App mit ",
    cameraLocalhostHint: " unter ",
    cameraBlockedHint: "Kamera blockiert — erlaube den Zugriff in der Browser-Leiste oder nutze Galerie.",
    cameraNoDeviceGallery: "Keine Kamera — nutze Galerie oder „Foto wählen“.",
    cameraInUseHint: "Kamera ist belegt (andere App schließen).",
    cameraLiveUnavailableHint: "Live-Kamera hier nicht möglich (z. B. Cursor-Vorschau). Nutze Galerie unten rechts.",
    cameraUnsupportedHint: "Live-Kamera nicht unterstützt — Galerie oder Datei-Upload nutzen.",
    cameraHttpsHint: "Kamera braucht localhost/HTTPS — starte mit npm run dev und öffne http://localhost:4137",
    cameraStartSlowHint: "Kamera startet zu lange — nutze Galerie oder einen anderen Browser.",
    cameraPreviewHint: "Vorschau nicht sichtbar — nutze Galerie oder einen anderen Browser.",
    ingredientsNotRecognizedHint: "Hmm, ich konnte keine Zutaten erkennen. Versuchen wir es nochmal mit einem klareren Foto, okay?",
    ingredientScanAnalyzingTitle: "Zutaten werden gescannt.",
    ingredientsPresentLabel: "Vorhanden",
    ingredientsMissingLabel: "Fehlend",
    createShoppingListBtn: "Einkaufsliste erstellen",
    addPhotoBtn: "Foto hinzufügen",
    finishScanAnalyzeBtn: "Fertig – analysieren",
    ingredientScanTapShutter: "Frigy-Kamera: unten aufnehmen, rechts Galerie",
    ingredientScanRetryAction: "Zutaten nochmal scannen",
    
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
    gained: "Gewonnen",
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
    dailyScanLimitReached: "Wöchentliches Scan-Limit erreicht",
    usedScansToday: "Du hast deinen kostenlosen wöchentlichen Scan bereits genutzt. Mit Premium bekommst du unbegrenzte Scans!",
    upgradeToPremium: "Upgrade auf Premium",
    unlimited: "Unbegrenzt",
    loginRequired: "Anmeldung erforderlich",
    loginToUseScanner: "Bitte melde dich an, um den Scanner zu nutzen.",
    aiAnalyzingIngredients: "KI analysiert deine Zutaten...",
    analyzingFridge: "Analysiere deinen Kühlschrank…",
    creatingWeeklyPlanFromScan: "Erstelle deinen persönlichen Wochenplan…",

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
    aiAdvisor: "Frigy Berater",
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
    
    // New Welcome Screen
    welcomeToFrigy: "Willkommen bei Frigy",
    splashBubbleText: "Ich kann es kaum erwarten, alles über dich zu erfahren!",
    welcomeSubtitle: "Die App, die deinen Kühlschrank scannt",
    scanYourFridge: "Kühlschrank scannen",
    andMuchMore: "...und vieles mehr",
    getReady: "Mach dich gefasst!",
    chooseLanguage: "Wähle deine Sprache",
    
    // Email Confirmation
    checkYourEmail: "Überprüfe deine E-Mail",
    confirmationEmailSent: "Konto erstellt – du kannst direkt weitermachen.",
    clickLinkToConfirm: "Keine E-Mail-Bestätigung nötig.",
    backToLogin: "Zurück zur Anmeldung",
    noEmailReceived: "Keine E-Mail erhalten? Überprüfe deinen Spam-Ordner.",
    emailConfirmed: "E-Mail bestätigt!",
    redirectingToApp: "Du wirst zur App weitergeleitet...",
    
    // Meal Plan Generation Overlay
    mealPlanGenerating1: "Frigy plant deine Woche…",
    mealPlanGenerating2: "Dein Wochenplan nimmt Form an",
    mealPlanGenerating3: "Wir machen dir das Denken leicht",
    mealPlanGenerating4: "Fast geschafft…",
    mealPlanGenerating5: "Frigy wählt die besten Rezepte",
    mealPlanGenerating6: "Noch ein kleiner Moment…",
    mealPlanGenerating7: "Deine Mahlzeiten werden vorbereitet",
    mealPlanBackgroundHint: "Du kannst weiterstöbern – Frigy arbeitet im Hintergrund",

    firstWeeklyPlanTitle: "Erstelle deinen ersten Wochenplan",
    firstWeeklyPlanSubtitle:
      "7 Tage voller passender Mahlzeiten — abgestimmt auf deine Ziele und Vorlieben.",
    firstWeeklyPlanCreateBtn: "Wochenplan erstellen",
    firstWeeklyPlanSuccessTitle: "Wochenplan erstellt!",
    firstWeeklyPlanSuccessSubtitle:
      "Deine Woche ist geplant. Du findest deinen Plan jederzeit unter „Plan“.",
    firstWeeklyPlanContinueBtn: "Weiter",
    firstWeeklyPlanPerfectBtn: "Perfekt",
    splashLoginAccountReady:
      "Dein Konto ist verbunden. Speichere deinen Plan und wähle dein Abo — danach erstellst du deinen ersten Wochenplan.",
    firstWeeklyPlanFeatureMeals: "5 Mahlzeiten pro Tag",
    firstWeeklyPlanFeatureMacros: "Passend zu deinen Makros",
    firstWeeklyPlanFeatureShopping: "Automatische Einkaufsliste",
    firstWeeklyPlanStayOnTab: "Bitte verlasse diesen Tab nicht — Frigy erstellt gerade deinen Wochenplan.",
    firstWeeklyPlanPreviewTitle: "Dein Wochenplan ist fertig!",
    firstWeeklyPlanPreviewSubtitle: "So sieht deine Woche aus. Unter „Plan“ findest du alles jederzeit wieder.",
    
    // Dashboard & Home
    goodMorning: "Guten Morgen",
    goodAfternoon: "Guten Tag",
    goodEvening: "Guten Abend",
    welcome: "Willkommen",
    weightHistory: "Gewichtsverlauf",
    tapForDetails: "Tippe für Details",
    mealPlanReady: "Wochenplan bereit",
    generateMealPlan: "Wochenplan erstellen",
    noMealPlanYet: "Noch kein Wochenplan",
    
    // Profile & Settings
    subscriptionStatus: "Abo-Status",
    subscriptionRefreshed: "Abo-Status aktualisiert",
    freePlanLabel: "Kein aktives Premium",
    deleteAccount: "Konto löschen",
    deleteAccountSoon: "Diese Funktion wird bald verfügbar sein.",
    resetOnboarding: "Onboarding zurücksetzen",
    onboardingResetMessage: "Beim nächsten Öffnen startet das Onboarding neu.",
    legal: "Rechtliches",
    privacyPolicy: "Datenschutzerklärung",
    termsOfService: "AGB",
    imprint: "Impressum",
    settingsLabel: "Einstellungen",
    reminders: "Erinnerungen",
    
    // Food Entry Detail
    mealName: "Mahlzeit Name",
    calories: "Kalorien",
    kcal: "kcal",
    grams: "g",
    saved: "Gespeichert",
    deleted: "Gelöscht",
    errorSaving: "Fehler beim Speichern",
    errorDeleting: "Fehler beim Löschen",
    entryNotFound: "Eintrag nicht gefunden",
    saving: "Speichert...",
    
    // Scan Page
    recentlyCooked: "Zuletzt gekocht",
    todayLabel: "Heute",
    yesterdayLabel: "Gestern",
    min: "Min",
    continueButton: "Weiter",
    
    // Additional translations
    cups: "Tassen",
    mlPerCup: "ml pro Tasse",
    orderIngredients: "Zutaten bestellen",
    orderIngredientsTitle: "Zutaten bestellen",
    followingIngredients: "Folgende Zutaten:",
    andMore: "weitere",
    recommended: "Empfohlen:",
    bringApp: "Bring! App",
    copyListPasteBring: "Liste kopieren & in Bring! einfügen",
    copiedForBring: "Für Bring! kopiert",
    openBringPaste: "Öffne Bring! und füge die Liste ein",
    orSearchDelivery: "Oder direkt beim Lieferdienst suchen:",
    worldwideDelivery: "Weltweite Lieferung",
    yourGoalLabel2: "Dein Ziel",
    youWillReach: "Du wirst",
    onDate: "am",
    now: "jetzt",
    perWeek: "Woche",
    yourDailyPlan: "Dein täglicher Plan",
    tapToAdjust: "Tippe zum Anpassen",
    dailyGoalLabel: "Tägliches Ziel",
    calculationBasedOn: "Berechnung basiert auf folgenden wissenschaftlichen Formeln:",
    bmrCalculation: "Grundumsatz-Berechnung",
    totalEnergyExpenditure: "Gesamtenergieverbrauch",
    issnProteinRecommendation: "ISSN Protein-Empfehlung",
    energyBalanceRule: "Energiebilanz-Regel",
    letFridgeDecide: "Lass deinen Kühlschrank entscheiden.",
    weBuildMeals: "Wir erstellen Mahlzeiten aus dem, was du schon hast.",
    iHandlePlanning: "Ich übernehme die Planung. Du isst einfach.",
    skipForNowBtn: "Später",
    enableCamera: "Kamera aktivieren",
    requiredForScanning: "Erforderlich zum Scannen",
    cameraAccessLabel: "Kamera-Zugriff",
    forFridgeScanning: "Für Kühlschrank-Scanning",
    allowAccess: "Erlauben",
    planningWithFrigy: "Planung mit Frigy",
    yourWayToSuccess: "Dein Weg zum Erfolg",
    withoutFrigyLabel: "Ohne Frigy",
    withFrigyLabel: "Mit Frigy",
    noStructure: "Keine Struktur",
    goalsMissed: "Ziele verfehlt",
    clearPlan: "Klarer Plan",
    successRate94: "94% Erfolg",
    goalAchievementLabel: "Zielerreichung",
    fasterLabel: "Schneller",
    savedPerDayLabel: "Gespart/Tag",
    usersReachGoalsFaster: "Nutzer erreichen ihre Ziele 2.4x schneller",
    yourTransformationLabel: "Deine Transformation",
    whatToExpectWithFrigy: "Was dich mit Frigy erwartet",
    moreEnergyLabel: "Mehr Energie",
    timeSavedLabel: "Zeit gespart",
    goalSuccessLabel: "Zielerfolg",
    saveYourProgress: "Speichere deinen Fortschritt",
    orContinueWith: "Oder schnell mit Google / Apple fortfahren",
    createAccountToSave: "Erstelle ein Konto um deinen Plan zu sichern",
    signInToContinue: "Melde dich an um fortzufahren",
    emailAddressPlaceholder: "E-Mail Adresse",
    passwordPlaceholder: "Passwort",
    registerBtn: "Registrieren",
    signInBtn: "Anmelden",
    alreadyRegisteredSignIn: "Bereits registriert? Hier anmelden",
    noAccountRegister: "Noch kein Konto? Hier registrieren",
    whyRegister: "Warum registrieren?",
    personalizedPlanSaved: "Dein personalisierter Plan wird gespeichert",
    progressSyncedDevices: "Fortschritt auf allen Geräten synchronisiert",
    accessRecipesMeals: "Zugang zu deinen Rezepten & Mahlzeiten",
    alreadyLoggedInContinue: "Bereits angemeldet - Weiter",
    chooseYourPlan: "Wähle deinen Plan",
    startFreeOrPremium: "Teste Premium 3 Tage gratis",
    freeLabel: "Premium",
    weeklyPlan1Gen: "Wochenplan (1x generieren)",
    waterTrackerLabel: "Wasser-Tracker",
    scansPerDay2: "2 Kühlschrank-Scans/Tag",
    basicRecipeSuggestions: "Basis-Rezeptvorschläge",
    premiumLabel2: "Premium",
    unlimitedScansLabel: "Unbegrenzte Scans",
    unlimitedMealPlanGen: "Unbegrenzte Meal Plan Generierung",
    shoppingListsLabel: "Einkaufslisten",
    statsMacroTracking: "Stats & Makro-Tracking",
    aiChatbotLabel: "KI-Chatbot",
    recommendedLabel: "EMPFOHLEN",
    trial7DaysFree: "3 Tage gratis",
    startWithFree: "Weiter",
    continueToPremium: "Weiter zu Premium",
    selectAPlan: "Wähle einen Plan",
    youSelectedFree: "Drücke den Button, um fortzufahren.",
    cookWithOthers: "Mit anderen kochen",
    discoverCommunityRecipes: "Entdecke Rezepte aus der Community",
    byUser: "von",
    exploreLater: "Später erkunden",
    youMadeIt: "Du hast es geschafft!",
    frigyReadyForYou: "Frigy ist bereit für dich!",
    letsGoContinue: "Weiter geht's!",
    systemReady: "Dein System ist bereit.",
    macrosStructureLessThinking: "Makros. Struktur. Weniger nachdenken.",
    toDashboard: "Zum Dashboard",
    personalizedOnPrefs: "Personalisiert auf deine Präferenzen",
    continueBtn: "Weiter",
    perfectBtn: "Perfekt!",
    weekLabel: "Woche",
    
    // MacroTracker Onboarding
    trackerYourBodyData: "Deine Körperdaten",
    trackerScrollToSet: "Scrolle um Werte einzustellen",
    trackerHeight: "Größe",
    trackerWeight: "Gewicht",
    trackerAge: "Alter",
    trackerPrivate: "100% privat",
    trackerYourGender: "Dein Geschlecht",
    trackerGenderImportant: "Wichtig für genaue Kalorien-Berechnung",
    trackerMale: "Männlich",
    trackerFemale: "Weiblich",
    trackerCalorieDifference: "~166 kcal Unterschied zwischen Männern & Frauen",
    trackerHowActive: "Wie aktiv bist du?",
    trackerForCalories: "Für genaue Kalorienberechnung",
    trackerLowActive: "Wenig aktiv",
    trackerLowActiveDesc: "Bürojob, wenig Bewegung",
    trackerLightActive: "Leicht aktiv",
    trackerLightActiveDesc: "1-2x Sport pro Woche",
    trackerModerateActive: "Moderat aktiv",
    trackerModerateActiveDesc: "3-5x Sport pro Woche",
    trackerVeryActive: "Sehr aktiv",
    trackerVeryActiveDesc: "6-7x Sport pro Woche",
    trackerYourGoal: "Dein Ziel",
    trackerLoseOrGain: "Abnehmen oder Zunehmen?",
    trackerLoseWeight: "Abnehmen",
    trackerGainWeight: "Zunehmen",
    trackerCalorieDeficit: "Kaloriendefizit",
    trackerCalorieSurplus: "Kalorienüberschuss",
    trackerYourTargetWeight: "Dein Zielgewicht",
    trackerHowMuchLose: "Wie viel möchtest du verlieren?",
    trackerHowMuchGain: "Wie viel möchtest du zunehmen?",
    trackerCurrent: "Aktuell",
    trackerGoalLabel: "Ziel",
    trackerWeightLoss: "Gewichtsverlust",
    trackerWeightGain: "Gewichtszunahme",
    trackerYourSpeed: "Dein Tempo",
    trackerHowFastLose: "Wie schnell möchtest du abnehmen?",
    trackerHowFastGain: "Wie schnell möchtest du zunehmen?",
    trackerKgPerWeek: "kg/Woche",
    trackerSlowSustainable: "Langsam & Nachhaltig",
    trackerModerate: "Moderat",
    trackerFast: "Schnell",
    trackerVeryFast: "Sehr Schnell",
    trackerHighDiscipline: "Hohes Tempo erfordert viel Disziplin!",
    trackerRecommended: "Empfohlen: 0.3-0.8 kg pro Woche",
    trackerYourPlan: "Dein persönlicher Plan",
    trackerPersonalizedForYou: "Personalisiert für dich",
    trackerYourDailyGoal: "Dein Tagesziel",
    trackerBasedOnScience: "Basierend auf wissenschaftlichen Formeln:",
    trackerMifflinFormula: "Mifflin-St Jeor Formel",
    trackerBMRCalc: "Grundumsatz-Berechnung",
    trackerTDEEFactors: "TDEE Aktivitätsfaktoren",
    trackerTotalEnergy: "Gesamtenergieverbrauch",
    trackerProteinRec: "Protein: 2g/kg Körpergewicht",
    trackerISSNProtein: "ISSN Protein-Empfehlung",
    trackerDeficitRule: "Defizit: 7700 kcal/kg",
    trackerEnergyBalance: "Energiebilanz-Regel",
    trackerYearsShort: "J.",
    
    // Onboarding Steps
    onboardingWhatsYourName: "Wie heißt du?",
    onboardingNameSubtitle: "Damit wir dich persönlich begrüßen können",
    onboardingYourName: "Dein Name",
    onboardingImFrigy: "Ich bin Frigy!",
    onboardingReadyToReachGoals: "Bist du bereit, gemeinsam deine Ziele zu erreichen?",
    onboardingYesLetsGo: "Ja, los geht's!",
    onboardingWhatsYourGoal: "Was ist dein Ziel?",
    onboardingSelectToPersonalize: "Wähle eines, um dein Erlebnis zu personalisieren",
    onboardingLoseWeight: "Abnehmen",
    onboardingMaintainWeight: "Gewicht halten",
    onboardingGainMuscle: "Muskeln aufbauen",
    onboardingEatHealthier: "Gesünder essen",
    onboardingLovedByThousands: "Von Tausenden geliebt",
    onboardingJoinUsers: "Schließe dich 50.000+ zufriedenen Nutzern an",
    onboardingRealResults: "Echte Ergebnisse",
    onboardingBasedOnData: "Basierend auf Nutzerdaten der letzten 6 Monate",
    onboardingLongTermResults: "Cal AI schafft langfristige Ergebnisse",
    onboardingComparisonSubtitle: "80% halten ihr Gewicht auch nach 6 Monaten",
    onboardingMaintainWeightLoss: "behalten ihr Gewicht auch nach 6 Monaten",
    onboardingReadyToStart: "Bereit loszulegen?",
    onboardingReachGoals: "erreichen ihre Ziele",
    onboardingAvgWeightLoss: "durchschn. Gewichtsverlust/Monat",
    onboardingTimeSaved: "täglich gespart bei Mahlzeitenplanung",
    onboardingTimeToPersonalize: "Zeit für Personalisierung!",
    onboardingQuickSteps: "3 schnelle Schritte zu deinen perfekten Makros",
    onboardingBody: "Körper",
    onboardingActivity: "Aktivität",
    onboardingMacros: "Makros",
    onboardingTakesLess30Sec: "Dauert weniger als 30 Sekunden",
    onboardingYourBodyData: "Deine Körperdaten",
    onboardingScrollToSet: "Scrolle um Werte einzustellen",
    onboardingHeight: "Größe",
    onboardingWeightLabel: "Gewicht",
    onboardingAgeLabel: "Alter",
    onboardingPrivate: "100% privat",
    onboardingYourGender: "Dein Geschlecht",
    onboardingGenderImportant: "Wichtig für genaue Kalorien-Berechnung",
    onboardingMale: "Männlich",
    onboardingFemale: "Weiblich",
    onboardingYourGoalMode: "Dein Ziel",
    onboardingWhatDirection: "In welche Richtung soll es gehen?",
    onboardingLoseWeightMode: "Abnehmen",
    onboardingGainWeightMode: "Zunehmen",
    onboardingTargetWeight: "Dein Zielgewicht",
    onboardingGoalIn: "Ziel in",
    onboardingWeeks: "Wochen",
    onboardingYourSpeed: "Dein Tempo",
    onboardingHowFast: "Wie schnell möchtest du dein Ziel erreichen?",
    onboardingSlow: "Langsam",
    onboardingGentle: "Sanft & nachhaltig",
    onboardingModerate: "Moderat",
    onboardingSteady: "Stetig & gesund",
    onboardingFast: "Zügig",
    onboardingAmbitious: "Ambitioniert",
    onboardingIntense: "Intensiv",
    onboardingMaximum: "Maximales Tempo",
    onboardingHighTempoWarning: "Hohes Tempo erfordert viel Disziplin!",
    onboardingRecommendedTempo: "Empfohlen: 0.3-0.8 kg pro Woche",
    onboardingDietaryPrefs: "Ernährungsweise",
    onboardingForMatchingRecipes: "Für passende Rezepte",
    onboardingVegetarian: "Vegetarisch",
    onboardingNoMeatFish: "Kein Fleisch oder Fisch",
    onboardingVegan: "Vegan",
    onboardingNoAnimalProducts: "Keine tierischen Produkte",
    onboardingPescatarian: "Pescetarisch",
    onboardingFishNoMeat: "Fisch, kein Fleisch",
    onboardingNone: "Keine",
    onboardingEverythingAllowed: "Alles erlaubt",
    onboardingAllergies: "Allergien & Unverträglichkeiten",
    onboardingMultiSelect: "Mehrfachauswahl möglich",
    onboardingGluten: "Gluten",
    onboardingLactose: "Laktose",
    onboardingNuts: "Nüsse",
    onboardingSoy: "Soja",
    onboardingEggs: "Eier",
    onboardingCookingExperience: "Kocherfahrung",
    onboardingForRecipeDifficulty: "Für passende Rezept-Schwierigkeit",
    onboardingBeginner: "Anfänger",
    onboardingSimpleRecipes: "Einfache Rezepte",
    onboardingIntermediate: "Fortgeschritten",
    onboardingMediumDishes: "Mittelschwere Gerichte",
    onboardingAdvanced: "Profi",
    onboardingDemandingCuisine: "Anspruchsvolle Küche",
    onboardingActivityLevel: "Aktivitätslevel",
    onboardingHowActive: "Wie aktiv bist du?",
    onboardingChill: "Chill",
    onboardingDeskJob: "Schreibtischjob, leichte Spaziergänge",
    onboardingActive: "Aktiv",
    onboardingRegularWorkouts: "Regelmäßiges Training",
    onboardingBeast: "Beast",
    onboardingIntenseTraining: "Intensives Training",
    onboardingAnalyzingGoals: "Ziele werden analysiert",
    onboardingProcessingBodyData: "Körperdaten verarbeiten",
    onboardingCalculatingTargetWeight: "Zielgewicht berechnen",
    onboardingDeterminingMacros: "Optimale Makros ermitteln",
    onboardingCreatingPlan: "Plan wird erstellt",
    onboardingYourDailyGoal: "Dein Tagesziel",
    onboardingPersonalizedForYou: "Personalisiert für dich",
    onboardingBasedOnScience: "Berechnung basiert auf folgenden wissenschaftlichen Formeln:",
    onboardingMifflinFormula: "Mifflin-St Jeor Formel (BMR)",
    onboardingBMRCalculation: "Grundumsatz-Berechnung",
    onboardingTDEEFactors: "TDEE Aktivitätsfaktoren",
    onboardingTotalEnergy: "Gesamtenergieverbrauch",
    onboardingProteinRecommendation: "Protein: 2g/kg Körpergewicht",
    onboardingISSNProtein: "ISSN Protein-Empfehlung",
    onboardingDeficitRule: "Defizit: 7700 kcal/kg",
    onboardingEnergyBalance: "Energiebilanz-Regel",
    onboardingLetFridgeDecide: "Lass deinen Kühlschrank entscheiden.",
    onboardingBuildMealsFromWhat: "Wir erstellen Mahlzeiten aus dem, was du schon hast.",
    onboardingIllHandlePlanning: "Ich übernehme die Planung. Du isst einfach.",
    onboardingScanFridgeNow: "Kühlschrank jetzt scannen",
    onboardingEnableCamera: "Kamera aktivieren",
    onboardingRequiredForScanning: "Erforderlich zum Scannen deines Kühlschranks",
    onboardingCameraAccess: "Kamera-Zugriff",
    onboardingForFridgeScanning: "Für Kühlschrank-Scanning",
    onboardingAllow: "Erlauben",
    onboardingOptionalHealthSync: "Optional: Gewicht und Ziele festlegen",
    onboardingYourWeeklyPlan: "Dein Wochenplan",
    onboardingPersonalizedMealPlan: "Personalisiert für deine Makros",
    onboardingWithoutFrigy: "Ohne Frigy",
    onboardingWithFrigy: "Mit Frigy",
    onboardingNoStructure: "Kein Plan",
    onboardingRandomMeals: "Zufällige Mahlzeiten",
    onboardingClearPlan: "Klarer Plan",
    onboardingSuccessRate: "94% Erfolg",
    onboardingGoalAchievement: "Zielerreichung",
    onboardingFaster: "Schneller",
    onboardingSavedPerDay: "Gespart/Tag",
    onboardingUsersFaster: "Nutzer erreichen ihre Ziele 2.4x schneller",
    onboardingYourTransformation: "Deine Transformation",
    onboardingWhatToExpect: "Was dich mit Frigy erwartet",
    onboardingMoreEnergy: "Mehr Energie",
    // How it works step
    onboardingHowItWorks: "So funktioniert's",
    onboardingHowItWorksSubtitle: "Zwei Features, ein System",
    onboardingHowItWorksStep1Title: "📷 Kühlschrank scannen",
    onboardingHowItWorksStep1Desc: "Scanne was du hast → Bekomme sofort Rezepte aus deinen Zutaten",
    onboardingHowItWorksStep2Title: "📅 Wochenplan",
    onboardingHowItWorksStep2Desc: "KI erstellt 7-Tage-Plan → Generiert automatisch Einkaufsliste",
    onboardingHowItWorksStep3Title: "🔄 Die Verbindung",
    onboardingHowItWorksStep3Desc: "Nach dem Einkauf scannst du → Gekaufte Zutaten werden abgehakt",
    onboardingHowItWorksTip: "Pro-Tipp: Scan-Rezepte können Wochenplan-Mahlzeiten ersetzen!",
    
    // Tutorial transition step
    onboardingPerfect: "Perfekt",
    onboardingIKnowWhatYouWant: "Ich weiß, was du willst",
    onboardingLetMeShowYou: "Lass mich dir zeigen, wie Frigy dir dabei hilft!",
    onboardingShowMeHow: "Zeig mir wie",
    
    // Tutorial steps (multi-page explanation)
    tutorialIntroTitle: "So funktioniert Frigy",
    tutorialIntroSubtitle: "In 6 einfachen Schritten",
    tutorialIntroDesc: "Lass dir Schritt für Schritt zeigen, wie alles zusammenhängt",
    tutorialScanTitle: "Kühlschrank scannen",
    tutorialScanStep: "Schritt 1 von 6",
    tutorialScanDesc1: "Öffne deinen Kühlschrank und mach ein Foto",
    tutorialScanDesc2: "Die KI erkennt automatisch alle Zutaten",
    tutorialScanDesc3: "Du siehst sofort, was du hast",
    tutorialRecipesTitle: "Rezepte erhalten",
    tutorialRecipesStep: "Schritt 2 von 6",
    tutorialRecipesDesc1: "Basierend auf deinen Zutaten erstellt die KI Rezepte",
    tutorialRecipesDesc2: "Abgestimmt auf deine Kalorienziele",
    tutorialRecipesDesc3: "Mit deiner bevorzugten Kochzeit",
    tutorialMealplanTitle: "Wochenplan erstellen",
    tutorialMealplanStep: "Schritt 3 von 6",
    tutorialMealplanDesc1: "Erstelle einen kompletten 7-Tage Essensplan",
    tutorialMealplanDesc2: "Tausche einzelne Mahlzeiten aus",
    tutorialMealplanDesc3: "Makros werden automatisch berechnet",
    tutorialShoppingTitle: "Einkaufsliste",
    tutorialShoppingStep: "Schritt 4 von 6",
    tutorialShoppingDesc1: "Alle fehlenden Zutaten werden automatisch aufgelistet",
    tutorialShoppingDesc2: "Hake ab, was du schon hast oder kaufst",
    tutorialShoppingDesc3: "Nach dem Einkauf → wieder scannen!",
    tutorialCycleTitle: "So hängt alles zusammen",
    tutorialCycleStep: "Schritt 5 von 6",
    tutorialCycleDesc1: "Das ist der Kreislauf von Frigy",
    tutorialCycleHave: "Was du HAST",
    tutorialCycleNeed: "Was du BRAUCHST",
    tutorialCycleEat: "Was du ISST",
    tutorialCycleExplain1: "Kühlschrank scannen zeigt dir, was du hast",
    tutorialCycleExplain2: "Der Wochenplan zeigt dir, was du essen wirst",
    tutorialCycleExplain3: "Die Einkaufsliste zeigt, was du noch kaufen musst",
    tutorialCycleExplain4: "Nach dem Einkauf scannst du wieder → Kreislauf komplett!",
    tutorialChatbotTitle: "Dein KI-Assistent",
    tutorialChatbotStep: "Schritt 6 von 6",
    tutorialChatbotDesc1: "Frag Frigy alles über deine Ernährung",
    tutorialChatbotDesc2: "Er kann deine Daten sehen und Aktionen ausführen",
    tutorialChatbotDesc3: "Gewicht tracken, Wasser hinzufügen, Tipps geben",
    tutorialChatbotHint: "Premium-Nutzer haben Zugang zum KI-Chatbot!",
    tutorialPageIndicator: "Seite",
    
    onboardingSaveProgress: "Speichere deinen Fortschritt",
    onboardingCreateAccount: "Erstelle ein Konto um deinen Plan zu sichern",
    onboardingSignInToContinue: "Melde dich an um fortzufahren",
    onboardingEmailAddress: "E-Mail Adresse",
    onboardingPasswordLabel: "Passwort",
    onboardingRegister: "Registrieren",
    onboardingSignInButton: "Anmelden",
    onboardingAlreadyRegistered: "Bereits registriert? Hier anmelden",
    onboardingNoAccountYet: "Noch kein Konto? Hier registrieren",
    onboardingWhyRegister: "Warum registrieren?",
    onboardingPlanSaved: "Dein personalisierter Plan wird gespeichert",
    onboardingProgressSynced: "Fortschritt auf allen Geräten synchronisiert",
    onboardingAccessRecipes: "Zugang zu deinen Rezepten & Mahlzeiten",
    onboardingAlreadyLoggedIn: "Bereits angemeldet - Weiter",
    onboardingChooseYourPlan: "Wähle deinen Plan",
    onboardingStartFreeOrPremium: "Teste Premium 3 Tage gratis",
    onboardingFree: "Premium",
    onboardingWeeklyPlan1x: "Wochenplan (1x generieren)",
    onboardingWaterTrackerFeature: "Wasser-Tracker",
    onboarding2ScansPerDay: "2 Kühlschrank-Scans/Tag",
    onboardingBasicRecipes: "Basis-Rezeptvorschläge",
    onboardingPremiumLabel: "Premium",
    onboardingUnlimitedScans: "Unbegrenzte Scans",
    onboardingUnlimitedMealPlans: "Unbegrenzte Meal Plan Generierung",
    onboardingShoppingLists: "Einkaufslisten",
    onboardingStatsAndMacros: "Stats & Makro-Tracking",
    onboardingAIChatbot: "KI-Chatbot",
    onboardingMostPopular: "Beliebteste Wahl",
    onboardingFreeTrial7Days: "3 Tage gratis",
    onboardingContinue: "Weiter",
    onboardingJoinCommunity: "Community beitreten",
    onboardingShareRecipes: "Teile Rezepte & motiviere andere",
    onboardingExploreLater: "Später erkunden",
    onboardingYouMadeIt: "Du hast es geschafft!",
    onboardingFrigyReady: "Frigy ist bereit für dich!",
    onboardingLetsGoContinue: "Weiter geht's!",
    onboardingSystemReady: "Dein System ist bereit.",
    onboardingMacrosStructure: "Makros. Struktur. Weniger nachdenken.",
    onboardingToDashboard: "Zum Dashboard",
    onboardingRegistrationFailed: "Registrierung fehlgeschlagen",
    onboardingEmailAlreadyRegistered: "Mit dieser E-Mail bist du schon registriert. Bitte melde dich an.",
    onboardingSuccessfullyRegistered: "Erfolgreich registriert!",
    onboardingProgressSavedMsg: "Dein Fortschritt wurde gespeichert.",
    onboardingLoginFailed: "Anmeldung fehlgeschlagen",
    onboardingWelcomeBack: "Willkommen zurück!",
    onboardingProgressLoaded: "Dein Fortschritt wurde geladen.",
    onboardingEnterEmailPassword: "Bitte E-Mail und Passwort eingeben",
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
    onboardingSlide7Title: "Weekly meal plans",
    onboardingSlide7Subtitle: "AI plans tailored to your goals",
    onboardingSlide8Title: "Community",
    onboardingSlide8Subtitle: "Share recipes & connect",
    onboardingSlide9Title: "Over 10,000 happy users",
    onboardingSlide10Title: "How did you hear about us?",
    onboardingSlide11Title: "What is your main goal?",
    onboardingSlide12Title: "How often do you cook?",
    onboardingSlide13Title: "What is your biggest challenge?",
    onboardingSlide14Title: "You're ready! 🎉",
    // Health Sync options
    healthSyncTitle: "Weight & activity",
    healthSyncSubtitle: "Log weight and steps in Frigy",
    connectAppleHealth: "Enter weight manually",
    connectGoogleFit: "Enter activity manually",
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
    freeTrialInfo: "3-day free trial",
    continueWithFree: "Start free",
    startFreeTrial: "Start 3-day free trial",
    
    // Auth
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    signIn: "Sign In",
    signUp: "Sign Up",
    signInWithGoogle: "Sign in with Google",
    signInWithApple: "Sign in with Apple",
    restorePurchases: "Restore purchases",
    redeemPromoCode: "Redeem promo code",
    storePromoCodeTitle: "Google Play promo code",
    storePromoCodeDescription:
      "Enter the code from Play Console. We open the Play Store app with your code — not the browser.",
    storePromoCodePlaceholder: "e.g. FRIGY2026",
    storePromoCodeOpenPlay: "Redeem in Play Store",
    storePromoCodePlayHint:
      "Important: Use the same Google account as in the Play Store. App must be installed from Play Store. Subscription and code must be published and active.",
    linkAppleAccount: "Link Apple account",
    noAccount: "No account yet? Sign up now",
    alreadyHaveAccount: "Already have an account? Sign in",
    forgotPassword: "Forgot password?",
    invalidEmail: "Invalid email address",
    passwordTooShort: "Password must be at least 8 characters long",
    enterEmailAndPassword: "Please enter email and password",
    pleaseSelectGoal: "Please select a goal",
    pleaseSelectGender: "Please select your gender",
    pleaseSelectActivityLevel: "Please select your activity level",
    onboardingPleaseLoginToProceed: "Please log in to continue",

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
    foodNotFound: "Food not found",
    patienceMessage: "Thanks for your patience...",
    calculatingCalories: "Calculating calories...",
    determiningNutrients: "Determining nutrients...",
    almostDone: "Almost done...",
    frigySays: "Frigy says",
    foodScanPlateTitle: "Plate is being scanned.",
    foodScanAiPowered: "AI-powered ✨",
    foodScanTryAnotherDish: "Try another dish",
    foodScanRecognized: "Recognized successfully!",
    foodScanScanAnother: "Scan another dish",
    foodScanContinue: "Continue",
    foodNotFoodHint: "Hmm, I do not think that is food. Let's try again with something edible, okay?",
    foodAnalyzeTimeout: "Analysis took too long. Please try again.",
    foodPhotoReadError: "Could not read the photo. Please capture it again.",
    foodPhotoProcessError: "The photo could not be processed. Please try again.",
    noAnalysisData: "No data received from analysis",
    gallery: "Gallery",
    cameraGalleryHint: " — or use the gallery below.",
    cameraOpenDevHint: "Open the app with ",
    cameraLocalhostHint: " at ",
    cameraBlockedHint: "Camera blocked — allow access in the browser bar or use the gallery.",
    cameraNoDeviceGallery: "No camera — use the gallery or choose a photo.",
    cameraInUseHint: "Camera is in use (close other apps).",
    cameraLiveUnavailableHint: "Live camera unavailable here (e.g. preview). Use the gallery bottom right.",
    cameraUnsupportedHint: "Live camera not supported — use gallery or file upload.",
    cameraHttpsHint: "Camera needs localhost/HTTPS — run npm run dev and open http://localhost:4137",
    cameraStartSlowHint: "Camera is taking too long — use the gallery or another browser.",
    cameraPreviewHint: "Preview not visible — use the gallery or another browser.",
    ingredientsNotRecognizedHint: "Hmm, I could not recognize any ingredients. Let's try again with a clearer photo, okay?",
    ingredientScanAnalyzingTitle: "Ingredients are being scanned.",
    ingredientsPresentLabel: "Available",
    ingredientsMissingLabel: "Missing",
    createShoppingListBtn: "Create shopping list",
    addPhotoBtn: "Add photo",
    finishScanAnalyzeBtn: "Done — analyze",
    ingredientScanTapShutter: "Frigy camera: capture below, gallery on the right",
    ingredientScanRetryAction: "Scan ingredients again",
    
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
    gained: "Gained",
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
    aiAnalyzingIngredients: "AI is analyzing your ingredients...",
    analyzingFridge: "Analyzing your fridge…",
    creatingWeeklyPlanFromScan: "Creating your personalized weekly plan…",

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
    aiAdvisor: "Frigy Advisor",
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
    
    // New Welcome Screen
    welcomeToFrigy: "Welcome to Frigy",
    splashBubbleText: "I can't wait to learn all about you!",
    welcomeSubtitle: "The app that scans your fridge",
    scanYourFridge: "Scan your fridge",
    andMuchMore: "...and much more",
    getReady: "Get ready!",
    chooseLanguage: "Choose your language",
    
    // Email Confirmation
    checkYourEmail: "Check your email",
    confirmationEmailSent: "Account created — you can continue right away.",
    clickLinkToConfirm: "No email confirmation required.",
    backToLogin: "Back to login",
    noEmailReceived: "Didn't receive an email? Check your spam folder.",
    emailConfirmed: "Email confirmed!",
    redirectingToApp: "Redirecting you to the app...",
    
    // Meal Plan Generation Overlay
    mealPlanGenerating1: "Frigy is planning your week…",
    mealPlanGenerating2: "Your weekly plan is taking shape",
    mealPlanGenerating3: "We're making it easy for you",
    mealPlanGenerating4: "Almost done…",
    mealPlanGenerating5: "Frigy is selecting the best recipes",
    mealPlanGenerating6: "Just a moment longer…",
    mealPlanGenerating7: "Your meals are being prepared",
    mealPlanBackgroundHint: "You can browse around – Frigy is working in the background",

    firstWeeklyPlanTitle: "Create your first weekly plan",
    firstWeeklyPlanSubtitle:
      "7 days of meals tailored to your goals and preferences.",
    firstWeeklyPlanCreateBtn: "Create weekly plan",
    firstWeeklyPlanSuccessTitle: "Weekly plan created!",
    firstWeeklyPlanSuccessSubtitle:
      "Your week is planned. Find your plan anytime under “Plan”.",
    firstWeeklyPlanContinueBtn: "Continue",
    firstWeeklyPlanPerfectBtn: "Perfect",
    splashLoginAccountReady:
      "Your account is connected. Save your plan and choose your subscription — then create your first weekly plan.",
    firstWeeklyPlanFeatureMeals: "5 meals per day",
    firstWeeklyPlanFeatureMacros: "Matched to your macros",
    firstWeeklyPlanFeatureShopping: "Automatic shopping list",
    firstWeeklyPlanStayOnTab: "Please don't leave this tab — Frigy is creating your weekly plan.",
    firstWeeklyPlanPreviewTitle: "Your weekly plan is ready!",
    firstWeeklyPlanPreviewSubtitle: "Here's your week at a glance. Find everything anytime under “Plan”.",
    
    // Dashboard & Home
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    welcome: "Welcome",
    weightHistory: "Weight History",
    tapForDetails: "Tap for details",
    mealPlanReady: "Meal plan ready",
    generateMealPlan: "Generate meal plan",
    noMealPlanYet: "No meal plan yet",
    
    // Profile & Settings
    subscriptionStatus: "Subscription Status",
    subscriptionRefreshed: "Subscription status refreshed",
    freePlanLabel: "No active Premium",
    deleteAccount: "Delete Account",
    deleteAccountSoon: "This feature will be available soon.",
    resetOnboarding: "Reset Onboarding",
    onboardingResetMessage: "Onboarding will restart next time you open the app.",
    legal: "Legal",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    imprint: "Imprint",
    settingsLabel: "Settings",
    reminders: "Reminders",
    
    // Food Entry Detail
    mealName: "Meal Name",
    calories: "Calories",
    kcal: "kcal",
    grams: "g",
    saved: "Saved",
    deleted: "Deleted",
    errorSaving: "Error saving",
    errorDeleting: "Error deleting",
    entryNotFound: "Entry not found",
    saving: "Saving...",
    
    // Scan Page
    recentlyCooked: "Recently cooked",
    todayLabel: "Today",
    yesterdayLabel: "Yesterday",
    min: "min",
    continueButton: "Continue",
    
    // Additional translations
    cups: "cups",
    mlPerCup: "ml per cup",
    orderIngredients: "Order ingredients",
    orderIngredientsTitle: "Order Ingredients",
    followingIngredients: "Following ingredients:",
    andMore: "more",
    recommended: "Recommended:",
    bringApp: "Bring! App",
    copyListPasteBring: "Copy list & paste in Bring!",
    copiedForBring: "Copied for Bring!",
    openBringPaste: "Open Bring! and paste the list",
    orSearchDelivery: "Or search directly at delivery service:",
    worldwideDelivery: "Worldwide delivery",
    yourGoalLabel2: "Your Goal",
    youWillReach: "You will reach",
    onDate: "on",
    now: "now",
    perWeek: "week",
    yourDailyPlan: "Your daily plan",
    tapToAdjust: "Tap to adjust",
    dailyGoalLabel: "Daily Goal",
    calculationBasedOn: "Calculation based on the following scientific formulas:",
    bmrCalculation: "BMR calculation",
    totalEnergyExpenditure: "Total energy expenditure",
    issnProteinRecommendation: "ISSN protein recommendation",
    energyBalanceRule: "Energy balance rule",
    letFridgeDecide: "Let your fridge decide.",
    weBuildMeals: "We build meals from what you already have.",
    iHandlePlanning: "I'll handle the planning. You just eat.",
    skipForNowBtn: "Skip for now",
    enableCamera: "Enable camera",
    requiredForScanning: "Required for scanning",
    cameraAccessLabel: "Camera access",
    forFridgeScanning: "For fridge scanning",
    allowAccess: "Allow",
    planningWithFrigy: "Planning with Frigy",
    yourWayToSuccess: "Your way to success",
    withoutFrigyLabel: "Without Frigy",
    withFrigyLabel: "With Frigy",
    noStructure: "No structure",
    goalsMissed: "Goals missed",
    clearPlan: "Clear plan",
    successRate94: "94% success",
    goalAchievementLabel: "Goal achievement",
    fasterLabel: "Faster",
    savedPerDayLabel: "Saved/day",
    usersReachGoalsFaster: "Users reach their goals 2.4x faster",
    yourTransformationLabel: "Your Transformation",
    whatToExpectWithFrigy: "What to expect with Frigy",
    moreEnergyLabel: "More Energy",
    timeSavedLabel: "Time Saved",
    goalSuccessLabel: "Goal Success",
    saveYourProgress: "Save your progress",
    orContinueWith: "Or continue quickly with Google / Apple",
    createAccountToSave: "Create an account to save your plan",
    signInToContinue: "Sign in to continue",
    emailAddressPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    registerBtn: "Register",
    signInBtn: "Sign In",
    alreadyRegisteredSignIn: "Already registered? Sign in here",
    noAccountRegister: "No account yet? Register here",
    whyRegister: "Why register?",
    personalizedPlanSaved: "Your personalized plan will be saved",
    progressSyncedDevices: "Progress synced across all devices",
    accessRecipesMeals: "Access to your recipes & meals",
    alreadyLoggedInContinue: "Already logged in - Continue",
    chooseYourPlan: "Choose your plan",
    startFreeOrPremium: "Try Premium free for 3 days",
    freeLabel: "Premium",
    weeklyPlan1Gen: "Weekly plan (1x generation)",
    waterTrackerLabel: "Water Tracker",
    scansPerDay2: "2 fridge scans/day",
    basicRecipeSuggestions: "Basic recipe suggestions",
    premiumLabel2: "Premium",
    unlimitedScansLabel: "Unlimited scans",
    unlimitedMealPlanGen: "Unlimited meal plan generation",
    shoppingListsLabel: "Shopping lists",
    statsMacroTracking: "Stats & macro tracking",
    aiChatbotLabel: "AI Chatbot",
    recommendedLabel: "RECOMMENDED",
    trial7DaysFree: "3 days free",
    startWithFree: "Continue",
    continueToPremium: "Continue to Premium",
    selectAPlan: "Select a plan",
    youSelectedFree: "Press the button to continue.",
    cookWithOthers: "Cook with others",
    discoverCommunityRecipes: "Discover recipes from the community",
    byUser: "by",
    exploreLater: "Explore later",
    youMadeIt: "You made it!",
    frigyReadyForYou: "Frigy is ready for you!",
    letsGoContinue: "Let's go!",
    systemReady: "Your system is ready.",
    macrosStructureLessThinking: "Macros. Structure. Less thinking.",
    toDashboard: "To Dashboard",
    personalizedOnPrefs: "Personalized to your preferences",
    continueBtn: "Continue",
    perfectBtn: "Perfect!",
    weekLabel: "week",
    
    // MacroTracker Onboarding
    trackerYourBodyData: "Your body data",
    trackerScrollToSet: "Scroll to set values",
    trackerHeight: "Height",
    trackerWeight: "Weight",
    trackerAge: "Age",
    trackerPrivate: "100% private",
    trackerYourGender: "Your gender",
    trackerGenderImportant: "Important for accurate calorie calculation",
    trackerMale: "Male",
    trackerFemale: "Female",
    trackerCalorieDifference: "~166 kcal difference between men & women",
    trackerHowActive: "How active are you?",
    trackerForCalories: "For accurate calorie calculation",
    trackerLowActive: "Low active",
    trackerLowActiveDesc: "Desk job, little movement",
    trackerLightActive: "Lightly active",
    trackerLightActiveDesc: "1-2x sports per week",
    trackerModerateActive: "Moderately active",
    trackerModerateActiveDesc: "3-5x sports per week",
    trackerVeryActive: "Very active",
    trackerVeryActiveDesc: "6-7x sports per week",
    trackerYourGoal: "Your goal",
    trackerLoseOrGain: "Lose or gain weight?",
    trackerLoseWeight: "Lose weight",
    trackerGainWeight: "Gain weight",
    trackerCalorieDeficit: "Calorie deficit",
    trackerCalorieSurplus: "Calorie surplus",
    trackerYourTargetWeight: "Your target weight",
    trackerHowMuchLose: "How much do you want to lose?",
    trackerHowMuchGain: "How much do you want to gain?",
    trackerCurrent: "Current",
    trackerGoalLabel: "Goal",
    trackerWeightLoss: "Weight loss",
    trackerWeightGain: "Weight gain",
    trackerYourSpeed: "Your pace",
    trackerHowFastLose: "How fast do you want to lose weight?",
    trackerHowFastGain: "How fast do you want to gain weight?",
    trackerKgPerWeek: "kg/week",
    trackerSlowSustainable: "Slow & sustainable",
    trackerModerate: "Moderate",
    trackerFast: "Fast",
    trackerVeryFast: "Very fast",
    trackerHighDiscipline: "High pace requires lots of discipline!",
    trackerRecommended: "Recommended: 0.3-0.8 kg per week",
    trackerYourPlan: "Your personal plan",
    trackerPersonalizedForYou: "Personalized for you",
    trackerYourDailyGoal: "Your daily goal",
    trackerBasedOnScience: "Based on scientific formulas:",
    trackerMifflinFormula: "Mifflin-St Jeor Formula",
    trackerBMRCalc: "BMR calculation",
    trackerTDEEFactors: "TDEE activity factors",
    trackerTotalEnergy: "Total energy expenditure",
    trackerProteinRec: "Protein: 2g/kg body weight",
    trackerISSNProtein: "ISSN protein recommendation",
    trackerDeficitRule: "Deficit: 7700 kcal/kg",
    trackerEnergyBalance: "Energy balance rule",
    trackerYearsShort: "y.",
    
    // Onboarding Steps
    onboardingWhatsYourName: "What's your name?",
    onboardingNameSubtitle: "So we can greet you personally",
    onboardingYourName: "Your name",
    onboardingImFrigy: "I'm Frigy!",
    onboardingReadyToReachGoals: "Are you ready to reach your goals together?",
    onboardingYesLetsGo: "Yes, let's go!",
    onboardingWhatsYourGoal: "What's your goal?",
    onboardingSelectToPersonalize: "Select one to personalize your experience",
    onboardingLoseWeight: "Lose weight",
    onboardingMaintainWeight: "Maintain weight",
    onboardingGainMuscle: "Gain muscle",
    onboardingEatHealthier: "Eat healthier",
    onboardingLovedByThousands: "Loved by thousands",
    onboardingJoinUsers: "Join 50,000+ happy users",
    onboardingRealResults: "Real results",
    onboardingBasedOnData: "Based on user data from the last 6 months",
    onboardingLongTermResults: "Cal AI creates long-term results",
    onboardingComparisonSubtitle: "80% maintain their weight loss after 6 months",
    onboardingMaintainWeightLoss: "maintain their weight loss after 6 months",
    onboardingReadyToStart: "Ready to get started?",
    onboardingReachGoals: "reach their goals",
    onboardingAvgWeightLoss: "avg. weight loss/month",
    onboardingTimeSaved: "saved daily on meal planning",
    onboardingTimeToPersonalize: "Time to personalize!",
    onboardingQuickSteps: "3 quick steps to unlock your perfect macros",
    onboardingBody: "Body",
    onboardingActivity: "Activity",
    onboardingMacros: "Macros",
    onboardingTakesLess30Sec: "Takes less than 30 seconds",
    onboardingYourBodyData: "Your body data",
    onboardingScrollToSet: "Scroll to set values",
    onboardingHeight: "Height",
    onboardingWeightLabel: "Weight",
    onboardingAgeLabel: "Age",
    onboardingPrivate: "100% private",
    onboardingYourGender: "Your gender",
    onboardingGenderImportant: "Important for accurate calorie calculation",
    onboardingMale: "Male",
    onboardingFemale: "Female",
    onboardingYourGoalMode: "Your goal",
    onboardingWhatDirection: "Which direction do you want to go?",
    onboardingLoseWeightMode: "Lose weight",
    onboardingGainWeightMode: "Gain weight",
    onboardingTargetWeight: "Your target weight",
    onboardingGoalIn: "Goal in",
    onboardingWeeks: "weeks",
    onboardingYourSpeed: "Your pace",
    onboardingHowFast: "How fast do you want to reach your goal?",
    onboardingSlow: "Slow",
    onboardingGentle: "Gentle & sustainable",
    onboardingModerate: "Moderate",
    onboardingSteady: "Steady & healthy",
    onboardingFast: "Fast",
    onboardingAmbitious: "Ambitious",
    onboardingIntense: "Intense",
    onboardingMaximum: "Maximum pace",
    onboardingHighTempoWarning: "High pace requires a lot of discipline!",
    onboardingRecommendedTempo: "Recommended: 0.3-0.8 kg per week",
    onboardingDietaryPrefs: "Dietary preferences",
    onboardingForMatchingRecipes: "For matching recipes",
    onboardingVegetarian: "Vegetarian",
    onboardingNoMeatFish: "No meat or fish",
    onboardingVegan: "Vegan",
    onboardingNoAnimalProducts: "No animal products",
    onboardingPescatarian: "Pescatarian",
    onboardingFishNoMeat: "Fish, no meat",
    onboardingNone: "None",
    onboardingEverythingAllowed: "Everything allowed",
    onboardingAllergies: "Allergies & intolerances",
    onboardingMultiSelect: "Multiple selection possible",
    onboardingGluten: "Gluten",
    onboardingLactose: "Lactose",
    onboardingNuts: "Nuts",
    onboardingSoy: "Soy",
    onboardingEggs: "Eggs",
    onboardingCookingExperience: "Cooking experience",
    onboardingForRecipeDifficulty: "For matching recipe difficulty",
    onboardingBeginner: "Beginner",
    onboardingSimpleRecipes: "Simple recipes",
    onboardingIntermediate: "Intermediate",
    onboardingMediumDishes: "Medium difficulty dishes",
    onboardingAdvanced: "Pro",
    onboardingDemandingCuisine: "Demanding cuisine",
    onboardingActivityLevel: "Activity level",
    onboardingHowActive: "How active are you?",
    onboardingChill: "Chill",
    onboardingDeskJob: "Desk job, light walks",
    onboardingActive: "Active",
    onboardingRegularWorkouts: "Regular workouts",
    onboardingBeast: "Beast",
    onboardingIntenseTraining: "Intense training",
    onboardingAnalyzingGoals: "Analyzing goals",
    onboardingProcessingBodyData: "Processing body data",
    onboardingCalculatingTargetWeight: "Calculating target weight",
    onboardingDeterminingMacros: "Determining optimal macros",
    onboardingCreatingPlan: "Creating plan",
    onboardingYourDailyGoal: "Your daily goal",
    onboardingPersonalizedForYou: "Personalized for you",
    onboardingBasedOnScience: "Calculation based on the following scientific formulas:",
    onboardingMifflinFormula: "Mifflin-St Jeor Formula (BMR)",
    onboardingBMRCalculation: "BMR calculation",
    onboardingTDEEFactors: "TDEE activity factors",
    onboardingTotalEnergy: "Total energy expenditure",
    onboardingProteinRecommendation: "Protein: 2g/kg body weight",
    onboardingISSNProtein: "ISSN protein recommendation",
    onboardingDeficitRule: "Deficit: 7700 kcal/kg",
    onboardingEnergyBalance: "Energy balance rule",
    onboardingLetFridgeDecide: "Let your fridge decide.",
    onboardingBuildMealsFromWhat: "We build meals from what you already have.",
    onboardingIllHandlePlanning: "I'll handle the planning. You just eat.",
    onboardingScanFridgeNow: "Scan fridge now",
    onboardingEnableCamera: "Enable camera",
    onboardingRequiredForScanning: "Required for scanning your fridge",
    onboardingCameraAccess: "Camera access",
    onboardingForFridgeScanning: "For fridge scanning",
    onboardingAllow: "Allow",
    onboardingOptionalHealthSync: "Optional: Set weight and goals",
    onboardingYourWeeklyPlan: "Your weekly plan",
    onboardingPersonalizedMealPlan: "Personalized for your macros",
    onboardingWithoutFrigy: "Without Frigy",
    onboardingWithFrigy: "With Frigy",
    onboardingNoStructure: "No plan",
    onboardingRandomMeals: "Random meals",
    onboardingClearPlan: "Clear plan",
    onboardingSuccessRate: "94% success",
    onboardingGoalAchievement: "Goal achievement",
    onboardingFaster: "Faster",
    onboardingSavedPerDay: "Saved/day",
    onboardingUsersFaster: "Users reach their goals 2.4x faster",
    onboardingYourTransformation: "Your Transformation",
    onboardingWhatToExpect: "What to expect with Frigy",
    onboardingMoreEnergy: "More Energy",
    // How it works step
    onboardingHowItWorks: "How it works",
    onboardingHowItWorksSubtitle: "Two features, one system",
    onboardingHowItWorksStep1Title: "📷 Scan fridge",
    onboardingHowItWorksStep1Desc: "Scan what you have → Get instant recipes from your ingredients",
    onboardingHowItWorksStep2Title: "📅 Weekly plan",
    onboardingHowItWorksStep2Desc: "AI creates 7-day plan → Automatically generates shopping list",
    onboardingHowItWorksStep3Title: "🔄 The connection",
    onboardingHowItWorksStep3Desc: "After shopping, scan → Purchased items get checked off",
    onboardingHowItWorksTip: "Pro tip: Scan recipes can replace weekly plan meals!",
    
    // Tutorial transition step
    onboardingPerfect: "Perfect",
    onboardingIKnowWhatYouWant: "I know what you want",
    onboardingLetMeShowYou: "Let me show you how Frigy can help!",
    onboardingShowMeHow: "Show me how",
    
    // Tutorial steps (multi-page explanation)
    tutorialIntroTitle: "How Frigy works",
    tutorialIntroSubtitle: "In 6 simple steps",
    tutorialIntroDesc: "Let us show you step by step how everything connects",
    tutorialScanTitle: "Scan your fridge",
    tutorialScanStep: "Step 1 of 6",
    tutorialScanDesc1: "Open your fridge and take a photo",
    tutorialScanDesc2: "AI automatically recognizes all ingredients",
    tutorialScanDesc3: "You instantly see what you have",
    tutorialRecipesTitle: "Get recipes",
    tutorialRecipesStep: "Step 2 of 6",
    tutorialRecipesDesc1: "Based on your ingredients, AI creates recipes",
    tutorialRecipesDesc2: "Tailored to your calorie goals",
    tutorialRecipesDesc3: "With your preferred cooking time",
    tutorialMealplanTitle: "Create weekly plan",
    tutorialMealplanStep: "Step 3 of 6",
    tutorialMealplanDesc1: "Create a complete 7-day meal plan",
    tutorialMealplanDesc2: "Swap individual meals",
    tutorialMealplanDesc3: "Macros are calculated automatically",
    tutorialShoppingTitle: "Shopping list",
    tutorialShoppingStep: "Step 4 of 6",
    tutorialShoppingDesc1: "All missing ingredients are automatically listed",
    tutorialShoppingDesc2: "Check off what you already have or buy",
    tutorialShoppingDesc3: "After shopping → scan again!",
    tutorialCycleTitle: "How it all connects",
    tutorialCycleStep: "Step 5 of 6",
    tutorialCycleDesc1: "This is the Frigy cycle",
    tutorialCycleHave: "What you HAVE",
    tutorialCycleNeed: "What you NEED",
    tutorialCycleEat: "What you'll EAT",
    tutorialCycleExplain1: "Fridge scan shows what you have",
    tutorialCycleExplain2: "Weekly plan shows what you'll eat",
    tutorialCycleExplain3: "Shopping list shows what you need to buy",
    tutorialCycleExplain4: "After shopping, scan again → cycle complete!",
    tutorialChatbotTitle: "Your AI Assistant",
    tutorialChatbotStep: "Step 6 of 6",
    tutorialChatbotDesc1: "Ask Frigy anything about your nutrition",
    tutorialChatbotDesc2: "He can see your data and perform actions",
    tutorialChatbotDesc3: "Track weight, add water, give tips",
    tutorialChatbotHint: "Premium users have access to the AI chatbot!",
    tutorialPageIndicator: "Page",
    
    onboardingSaveProgress: "Save your progress",
    onboardingCreateAccount: "Create an account to save your plan",
    onboardingSignInToContinue: "Sign in to continue",
    onboardingEmailAddress: "Email address",
    onboardingPasswordLabel: "Password",
    onboardingRegister: "Register",
    onboardingSignInButton: "Sign in",
    onboardingAlreadyRegistered: "Already registered? Sign in here",
    onboardingNoAccountYet: "No account yet? Register here",
    onboardingWhyRegister: "Why register?",
    onboardingPlanSaved: "Your personalized plan will be saved",
    onboardingProgressSynced: "Progress synced across all devices",
    onboardingAccessRecipes: "Access to your recipes & meals",
    onboardingAlreadyLoggedIn: "Already logged in - Continue",
    onboardingChooseYourPlan: "Choose your plan",
    onboardingStartFreeOrPremium: "Try Premium free for 3 days",
    onboardingFree: "Premium",
    onboardingWeeklyPlan1x: "Weekly plan (1x generate)",
    onboardingWaterTrackerFeature: "Water tracker",
    onboarding2ScansPerDay: "2 fridge scans/day",
    onboardingBasicRecipes: "Basic recipe suggestions",
    onboardingPremiumLabel: "Premium",
    onboardingUnlimitedScans: "Unlimited scans",
    onboardingUnlimitedMealPlans: "Unlimited meal plan generation",
    onboardingShoppingLists: "Shopping lists",
    onboardingStatsAndMacros: "Stats & macro tracking",
    onboardingAIChatbot: "AI chatbot",
    onboardingMostPopular: "Most popular choice",
    onboardingFreeTrial7Days: "3 days free",
    onboardingContinue: "Continue",
    onboardingJoinCommunity: "Join community",
    onboardingShareRecipes: "Share recipes & motivate others",
    onboardingExploreLater: "Explore later",
    onboardingYouMadeIt: "You made it!",
    onboardingFrigyReady: "Frigy is ready for you!",
    onboardingLetsGoContinue: "Let's go!",
    onboardingSystemReady: "Your system is ready.",
    onboardingMacrosStructure: "Macros. Structure. Less thinking.",
    onboardingToDashboard: "To dashboard",
    onboardingRegistrationFailed: "Registration failed",
    onboardingEmailAlreadyRegistered: "You already registered with this email. Please sign in.",
    onboardingSuccessfullyRegistered: "Successfully registered!",
    onboardingProgressSavedMsg: "Your progress has been saved.",
    onboardingLoginFailed: "Login failed",
    onboardingWelcomeBack: "Welcome back!",
    onboardingProgressLoaded: "Your progress has been loaded.",
    onboardingEnterEmailPassword: "Please enter email and password",
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
    onboardingSlide7Title: "Plans repas hebdo",
    onboardingSlide7Subtitle: "Plans IA adaptés à tes objectifs",
    onboardingSlide8Title: "Communauté",
    onboardingSlide8Subtitle: "Partagez des recettes et connectez-vous",
    onboardingSlide9Title: "Plus de 10 000 utilisateurs satisfaits",
    onboardingSlide10Title: "Comment avez-vous entendu parler de nous?",
    onboardingSlide11Title: "Quel est votre objectif principal?",
    onboardingSlide12Title: "À quelle fréquence cuisinez-vous?",
    onboardingSlide13Title: "Quel est votre plus grand défi?",
    onboardingSlide14Title: "Vous êtes prêt! 🎉",
    // Health Sync options
    healthSyncTitle: "Poids et activité",
    healthSyncSubtitle: "Saisis poids et pas dans Frigy",
    connectAppleHealth: "Saisir le poids manuellement",
    connectGoogleFit: "Saisir l'activité manuellement",
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
    freeTrialInfo: "3 jours gratuits",
    continueWithFree: "Commencer gratuitement",
    startFreeTrial: "Essayer 3 jours gratuits",
    
    // Auth
    email: "E-mail",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    signIn: "Connexion",
    signUp: "Inscription",
    signInWithGoogle: "Se connecter avec Google",
    signInWithApple: "Se connecter avec Apple",
    restorePurchases: "Restaurer les achats",
    redeemPromoCode: "Utiliser un code promo",
    storePromoCodeTitle: "Code promo Google Play",
    storePromoCodeDescription:
      "Saisis le code de la Play Console. Nous ouvrons l’app Play Store avec ton code — pas le navigateur.",
    storePromoCodePlaceholder: "ex. FRIGY2026",
    storePromoCodeOpenPlay: "Utiliser dans le Play Store",
    storePromoCodePlayHint:
      "Important : même compte Google que le Play Store. L’app doit être installée depuis le Play Store. Abonnement et code publiés et actifs.",
    linkAppleAccount: "Lier le compte Apple",
    noAccount: "Pas encore de compte? Inscrivez-vous",
    alreadyHaveAccount: "Déjà un compte? Connectez-vous",
    forgotPassword: "Mot de passe oublié?",
    invalidEmail: "Adresse e-mail invalide",
    passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères",
    enterEmailAndPassword: "Veuillez entrer l'e-mail et le mot de passe",
    pleaseSelectGoal: "Veuillez sélectionner un objectif",
    pleaseSelectGender: "Veuillez sélectionner votre sexe",
    pleaseSelectActivityLevel: "Veuillez sélectionner votre niveau d'activité",
    onboardingPleaseLoginToProceed: "Veuillez vous connecter pour continuer",

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
    foodNotFound: "Aliment introuvable",
    patienceMessage: "Merci pour votre patience...",
    calculatingCalories: "Calcul des calories...",
    determiningNutrients: "Détermination des nutriments...",
    almostDone: "Presque terminé...",
    frigySays: "Frigy dit",
    foodScanPlateTitle: "L'assiette est scannée.",
    foodScanAiPowered: "Propulsé par l'IA ✨",
    foodScanTryAnotherDish: "Essayer un autre plat",
    foodScanRecognized: "Reconnu avec succès !",
    foodScanScanAnother: "Autre plat",
    foodScanContinue: "Continuer",
    foodNotFoodHint: "Hmm, je ne pense pas que ce soit de la nourriture. On essaie avec quelque chose de comestible, d'accord ?",
    foodAnalyzeTimeout: "L'analyse a pris trop de temps. Réessaie.",
    foodPhotoReadError: "Impossible de lire la photo. Reprends-la.",
    foodPhotoProcessError: "La photo n'a pas pu être traitée. Réessaie.",
    noAnalysisData: "Aucune donnée reçue de l'analyse",
    gallery: "Galerie",
    cameraGalleryHint: " — ou utilise la galerie en bas.",
    cameraOpenDevHint: "Ouvre l'app avec ",
    cameraLocalhostHint: " sur ",
    cameraBlockedHint: "Caméra bloquée — autorise l'accès dans le navigateur ou utilise la galerie.",
    cameraNoDeviceGallery: "Pas de caméra — utilise la galerie ou choisis une photo.",
    cameraInUseHint: "Caméra occupée (ferme les autres apps).",
    cameraLiveUnavailableHint: "Caméra live indisponible ici. Utilise la galerie en bas à droite.",
    cameraUnsupportedHint: "Caméra live non prise en charge — utilise la galerie.",
    cameraHttpsHint: "La caméra nécessite localhost/HTTPS — lance npm run dev et ouvre http://localhost:4137",
    cameraStartSlowHint: "La caméra met trop de temps — utilise la galerie ou un autre navigateur.",
    cameraPreviewHint: "Aperçu invisible — utilise la galerie ou un autre navigateur.",
    ingredientsNotRecognizedHint: "Hmm, je n'ai pas réussi à reconnaître les ingrédients. On réessaie avec une photo plus nette ?",
    ingredientScanAnalyzingTitle: "Les ingrédients sont scannés.",
    ingredientsPresentLabel: "Disponible",
    ingredientsMissingLabel: "Manquant",
    createShoppingListBtn: "Créer la liste de courses",
    addPhotoBtn: "Ajouter une photo",
    finishScanAnalyzeBtn: "Terminé — analyser",
    ingredientScanTapShutter: "Caméra Frigy : capture en bas, galerie à droite",
    ingredientScanRetryAction: "Scanner à nouveau",
    
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
    gained: "Gagné",
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
    aiAnalyzingIngredients: "L'IA analyse vos ingrédients...",
    analyzingFridge: "Analyse de votre réfrigérateur…",
    creatingWeeklyPlanFromScan: "Création de votre plan de repas personnalisé…",

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
    aiAdvisor: "Conseiller Frigy",
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
    
    // New Welcome Screen
    welcomeToFrigy: "Bienvenue sur Frigy",
    splashBubbleText: "J'ai hâte d'en savoir plus sur toi !",
    welcomeSubtitle: "L'app qui scanne votre frigo",
    scanYourFridge: "Scanner votre frigo",
    andMuchMore: "...et bien plus encore",
    getReady: "Préparez-vous!",
    chooseLanguage: "Choisissez votre langue",
    
    // Email Confirmation
    checkYourEmail: "Vérifiez votre e-mail",
    confirmationEmailSent: "Compte créé — tu peux continuer tout de suite.",
    clickLinkToConfirm: "Pas de confirmation par e-mail nécessaire.",
    backToLogin: "Retour à la connexion",
    noEmailReceived: "Pas reçu d'e-mail? Vérifiez votre dossier spam.",
    emailConfirmed: "E-mail confirmé!",
    redirectingToApp: "Redirection vers l'application...",
    
    // Meal Plan Generation Overlay
    mealPlanGenerating1: "Frigy prépare ta semaine…",
    mealPlanGenerating2: "Ton plan hebdomadaire prend forme",
    mealPlanGenerating3: "On te facilite la vie",
    mealPlanGenerating4: "Presque terminé…",
    mealPlanGenerating5: "Frigy sélectionne les meilleures recettes",
    mealPlanGenerating6: "Encore un petit moment…",
    mealPlanGenerating7: "Tes repas sont en préparation",
    mealPlanBackgroundHint: "Tu peux continuer à naviguer – Frigy travaille en arrière-plan",

    firstWeeklyPlanTitle: "Crée ton premier plan de la semaine",
    firstWeeklyPlanSubtitle:
      "7 jours de repas adaptés à tes objectifs et préférences.",
    firstWeeklyPlanCreateBtn: "Créer le plan hebdomadaire",
    firstWeeklyPlanSuccessTitle: "Plan hebdomadaire créé !",
    firstWeeklyPlanSuccessSubtitle:
      "Ta semaine est prête. Retrouve ton plan à tout moment sous « Plan ».",
    firstWeeklyPlanContinueBtn: "Continuer",
    firstWeeklyPlanPerfectBtn: "Parfait",
    splashLoginAccountReady:
      "Ton compte est connecté. Enregistre ton plan et choisis ton abonnement — puis crée ton premier plan de la semaine.",
    firstWeeklyPlanFeatureMeals: "5 repas par jour",
    firstWeeklyPlanFeatureMacros: "Adapté à tes macros",
    firstWeeklyPlanFeatureShopping: "Liste de courses automatique",
    firstWeeklyPlanStayOnTab: "Ne quitte pas cet onglet — Frigy prépare ton plan de la semaine.",
    firstWeeklyPlanPreviewTitle: "Ton plan de la semaine est prêt !",
    firstWeeklyPlanPreviewSubtitle: "Voici ta semaine. Retrouve tout sous « Plan » à tout moment.",
    
    // Dashboard & Home
    goodMorning: "Bonjour",
    goodAfternoon: "Bon après-midi",
    goodEvening: "Bonsoir",
    welcome: "Bienvenue",
    weightHistory: "Historique du poids",
    tapForDetails: "Appuyer pour les détails",
    mealPlanReady: "Plan de repas prêt",
    generateMealPlan: "Générer le plan de repas",
    noMealPlanYet: "Pas encore de plan de repas",
    
    // Profile & Settings
    subscriptionStatus: "Statut de l'abonnement",
    subscriptionRefreshed: "Statut de l'abonnement actualisé",
    freePlanLabel: "Premium inactif",
    deleteAccount: "Supprimer le compte",
    deleteAccountSoon: "Cette fonctionnalité sera bientôt disponible.",
    resetOnboarding: "Réinitialiser l'onboarding",
    onboardingResetMessage: "L'onboarding redémarrera à la prochaine ouverture.",
    legal: "Mentions légales",
    privacyPolicy: "Politique de confidentialité",
    termsOfService: "Conditions d'utilisation",
    imprint: "Mentions légales",
    settingsLabel: "Paramètres",
    reminders: "Rappels",
    
    // Food Entry Detail
    mealName: "Nom du repas",
    calories: "Calories",
    kcal: "kcal",
    grams: "g",
    saved: "Enregistré",
    deleted: "Supprimé",
    errorSaving: "Erreur lors de l'enregistrement",
    errorDeleting: "Erreur lors de la suppression",
    entryNotFound: "Entrée non trouvée",
    saving: "Enregistrement...",
    
    // Scan Page
    recentlyCooked: "Récemment cuisiné",
    todayLabel: "Aujourd'hui",
    yesterdayLabel: "Hier",
    min: "min",
    continueButton: "Continuer",
    
    // Additional translations
    cups: "tasses",
    mlPerCup: "ml par tasse",
    orderIngredients: "Commander les ingrédients",
    orderIngredientsTitle: "Commander les ingrédients",
    followingIngredients: "Ingrédients suivants:",
    andMore: "de plus",
    recommended: "Recommandé:",
    bringApp: "Bring! App",
    copyListPasteBring: "Copier la liste & coller dans Bring!",
    copiedForBring: "Copié pour Bring!",
    openBringPaste: "Ouvre Bring! et colle la liste",
    orSearchDelivery: "Ou rechercher directement chez le livreur:",
    worldwideDelivery: "Livraison mondiale",
    yourGoalLabel2: "Ton objectif",
    youWillReach: "Tu atteindras",
    onDate: "le",
    now: "maintenant",
    perWeek: "semaine",
    yourDailyPlan: "Ton plan quotidien",
    tapToAdjust: "Appuie pour ajuster",
    dailyGoalLabel: "Objectif quotidien",
    calculationBasedOn: "Calcul basé sur les formules scientifiques suivantes:",
    bmrCalculation: "Calcul du métabolisme de base",
    totalEnergyExpenditure: "Dépense énergétique totale",
    issnProteinRecommendation: "Recommandation protéines ISSN",
    energyBalanceRule: "Règle d'équilibre énergétique",
    letFridgeDecide: "Laisse ton frigo décider.",
    weBuildMeals: "On crée des repas avec ce que tu as déjà.",
    iHandlePlanning: "Je m'occupe de la planification. Toi, tu manges.",
    skipForNowBtn: "Plus tard",
    enableCamera: "Activer la caméra",
    requiredForScanning: "Requis pour scanner",
    cameraAccessLabel: "Accès caméra",
    forFridgeScanning: "Pour scanner le frigo",
    allowAccess: "Autoriser",
    planningWithFrigy: "Planification avec Frigy",
    yourWayToSuccess: "Ton chemin vers le succès",
    withoutFrigyLabel: "Sans Frigy",
    withFrigyLabel: "Avec Frigy",
    noStructure: "Pas de structure",
    goalsMissed: "Objectifs manqués",
    clearPlan: "Plan clair",
    successRate94: "94% de succès",
    goalAchievementLabel: "Atteinte des objectifs",
    fasterLabel: "Plus rapide",
    savedPerDayLabel: "Gagné/jour",
    usersReachGoalsFaster: "Les utilisateurs atteignent leurs objectifs 2.4x plus vite",
    yourTransformationLabel: "Ta Transformation",
    whatToExpectWithFrigy: "Ce qui t'attend avec Frigy",
    moreEnergyLabel: "Plus d'énergie",
    timeSavedLabel: "Temps gagné",
    goalSuccessLabel: "Succès objectif",
    saveYourProgress: "Sauvegarde ta progression",
    orContinueWith: "Ou continue rapidement avec Google / Apple",
    createAccountToSave: "Crée un compte pour sauvegarder ton plan",
    signInToContinue: "Connecte-toi pour continuer",
    emailAddressPlaceholder: "Adresse e-mail",
    passwordPlaceholder: "Mot de passe",
    registerBtn: "S'inscrire",
    signInBtn: "Se connecter",
    alreadyRegisteredSignIn: "Déjà inscrit? Connecte-toi ici",
    noAccountRegister: "Pas encore de compte? Inscris-toi ici",
    whyRegister: "Pourquoi s'inscrire?",
    personalizedPlanSaved: "Ton plan personnalisé sera sauvegardé",
    progressSyncedDevices: "Progression synchronisée sur tous les appareils",
    accessRecipesMeals: "Accès à tes recettes & repas",
    alreadyLoggedInContinue: "Déjà connecté - Continuer",
    chooseYourPlan: "Choisis ton plan",
    startFreeOrPremium: "Essaie Premium gratuitement pendant 3 jours",
    freeLabel: "Premium",
    weeklyPlan1Gen: "Plan hebdo (1x génération)",
    waterTrackerLabel: "Suivi d'eau",
    scansPerDay2: "2 scans frigo/jour",
    basicRecipeSuggestions: "Suggestions de recettes de base",
    premiumLabel2: "Premium",
    unlimitedScansLabel: "Scans illimités",
    unlimitedMealPlanGen: "Génération de plans illimitée",
    shoppingListsLabel: "Listes de courses",
    statsMacroTracking: "Stats & suivi des macros",
    aiChatbotLabel: "Chatbot IA",
    recommendedLabel: "RECOMMANDÉ",
    trial7DaysFree: "3 jours gratuits",
    startWithFree: "Continuer",
    continueToPremium: "Continuer vers Premium",
    selectAPlan: "Choisis un plan",
    youSelectedFree: "Appuie sur le bouton pour continuer.",
    cookWithOthers: "Cuisiner avec les autres",
    discoverCommunityRecipes: "Découvre des recettes de la communauté",
    byUser: "par",
    exploreLater: "Explorer plus tard",
    youMadeIt: "Tu as réussi!",
    frigyReadyForYou: "Frigy est prêt pour toi!",
    letsGoContinue: "C'est parti!",
    systemReady: "Ton système est prêt.",
    macrosStructureLessThinking: "Macros. Structure. Moins de réflexion.",
    toDashboard: "Vers le tableau de bord",
    personalizedOnPrefs: "Personnalisé selon tes préférences",
    continueBtn: "Continuer",
    perfectBtn: "Parfait!",
    weekLabel: "semaine",
    
    // MacroTracker Onboarding
    trackerYourBodyData: "Tes données corporelles",
    trackerScrollToSet: "Fais défiler pour définir les valeurs",
    trackerHeight: "Taille",
    trackerWeight: "Poids",
    trackerAge: "Âge",
    trackerPrivate: "100% privé",
    trackerYourGender: "Ton genre",
    trackerGenderImportant: "Important pour un calcul précis des calories",
    trackerMale: "Homme",
    trackerFemale: "Femme",
    trackerCalorieDifference: "~166 kcal différence entre hommes & femmes",
    trackerHowActive: "Quelle est ton activité?",
    trackerForCalories: "Pour un calcul précis des calories",
    trackerLowActive: "Peu actif",
    trackerLowActiveDesc: "Bureau, peu de mouvement",
    trackerLightActive: "Légèrement actif",
    trackerLightActiveDesc: "1-2x sport par semaine",
    trackerModerateActive: "Modérément actif",
    trackerModerateActiveDesc: "3-5x sport par semaine",
    trackerVeryActive: "Très actif",
    trackerVeryActiveDesc: "6-7x sport par semaine",
    trackerYourGoal: "Ton objectif",
    trackerLoseOrGain: "Perdre ou prendre du poids?",
    trackerLoseWeight: "Perdre du poids",
    trackerGainWeight: "Prendre du poids",
    trackerCalorieDeficit: "Déficit calorique",
    trackerCalorieSurplus: "Surplus calorique",
    trackerYourTargetWeight: "Ton poids cible",
    trackerHowMuchLose: "Combien veux-tu perdre?",
    trackerHowMuchGain: "Combien veux-tu prendre?",
    trackerCurrent: "Actuel",
    trackerGoalLabel: "Objectif",
    trackerWeightLoss: "Perte de poids",
    trackerWeightGain: "Prise de poids",
    trackerYourSpeed: "Ton rythme",
    trackerHowFastLose: "À quelle vitesse veux-tu perdre du poids?",
    trackerHowFastGain: "À quelle vitesse veux-tu prendre du poids?",
    trackerKgPerWeek: "kg/semaine",
    trackerSlowSustainable: "Lent & durable",
    trackerModerate: "Modéré",
    trackerFast: "Rapide",
    trackerVeryFast: "Très rapide",
    trackerHighDiscipline: "Un rythme élevé demande beaucoup de discipline!",
    trackerRecommended: "Recommandé: 0.3-0.8 kg par semaine",
    trackerYourPlan: "Ton plan personnel",
    trackerPersonalizedForYou: "Personnalisé pour toi",
    trackerYourDailyGoal: "Ton objectif quotidien",
    trackerBasedOnScience: "Basé sur des formules scientifiques:",
    trackerMifflinFormula: "Formule Mifflin-St Jeor",
    trackerBMRCalc: "Calcul du métabolisme de base",
    trackerTDEEFactors: "Facteurs d'activité TDEE",
    trackerTotalEnergy: "Dépense énergétique totale",
    trackerProteinRec: "Protéines: 2g/kg de poids corporel",
    trackerISSNProtein: "Recommandation protéines ISSN",
    trackerDeficitRule: "Déficit: 7700 kcal/kg",
    trackerEnergyBalance: "Règle d'équilibre énergétique",
    trackerYearsShort: "ans",
    
    // Onboarding Steps
    onboardingWhatsYourName: "Comment tu t'appelles ?",
    onboardingNameSubtitle: "Pour te saluer personnellement",
    onboardingYourName: "Ton prénom",
    onboardingImFrigy: "Je suis Frigy!",
    onboardingReadyToReachGoals: "Es-tu prêt à atteindre tes objectifs ensemble?",
    onboardingYesLetsGo: "Oui, allons-y!",
    onboardingWhatsYourGoal: "Quel est ton objectif?",
    onboardingSelectToPersonalize: "Sélectionne pour personnaliser ton expérience",
    onboardingLoseWeight: "Perdre du poids",
    onboardingMaintainWeight: "Maintenir le poids",
    onboardingGainMuscle: "Prendre du muscle",
    onboardingEatHealthier: "Manger plus sainement",
    onboardingLovedByThousands: "Aimé par des milliers",
    onboardingJoinUsers: "Rejoins 50 000+ utilisateurs satisfaits",
    onboardingRealResults: "Résultats réels",
    onboardingBasedOnData: "Basé sur les données des 6 derniers mois",
    onboardingLongTermResults: "Cal AI crée des résultats à long terme",
    onboardingComparisonSubtitle: "80% maintiennent leur perte de poids après 6 mois",
    onboardingMaintainWeightLoss: "maintiennent leur perte de poids après 6 mois",
    onboardingReadyToStart: "Prêt à commencer?",
    onboardingReachGoals: "atteignent leurs objectifs",
    onboardingAvgWeightLoss: "perte de poids moy./mois",
    onboardingTimeSaved: "gagnées par jour en planification",
    onboardingTimeToPersonalize: "Temps de personnaliser!",
    onboardingQuickSteps: "3 étapes rapides pour tes macros parfaites",
    onboardingBody: "Corps",
    onboardingActivity: "Activité",
    onboardingMacros: "Macros",
    onboardingTakesLess30Sec: "Prend moins de 30 secondes",
    onboardingYourBodyData: "Tes données corporelles",
    onboardingScrollToSet: "Fais défiler pour définir les valeurs",
    onboardingHeight: "Taille",
    onboardingWeightLabel: "Poids",
    onboardingAgeLabel: "Âge",
    onboardingPrivate: "100% privé",
    onboardingYourGender: "Ton genre",
    onboardingGenderImportant: "Important pour un calcul précis des calories",
    onboardingMale: "Homme",
    onboardingFemale: "Femme",
    onboardingYourGoalMode: "Ton objectif",
    onboardingWhatDirection: "Dans quelle direction veux-tu aller?",
    onboardingLoseWeightMode: "Perdre du poids",
    onboardingGainWeightMode: "Prendre du poids",
    onboardingTargetWeight: "Ton poids cible",
    onboardingGoalIn: "Objectif en",
    onboardingWeeks: "semaines",
    onboardingYourSpeed: "Ton rythme",
    onboardingHowFast: "À quelle vitesse veux-tu atteindre ton objectif?",
    onboardingSlow: "Lent",
    onboardingGentle: "Doux & durable",
    onboardingModerate: "Modéré",
    onboardingSteady: "Régulier & sain",
    onboardingFast: "Rapide",
    onboardingAmbitious: "Ambitieux",
    onboardingIntense: "Intense",
    onboardingMaximum: "Rythme maximum",
    onboardingHighTempoWarning: "Un rythme élevé demande beaucoup de discipline!",
    onboardingRecommendedTempo: "Recommandé: 0.3-0.8 kg par semaine",
    onboardingDietaryPrefs: "Régime alimentaire",
    onboardingForMatchingRecipes: "Pour des recettes adaptées",
    onboardingVegetarian: "Végétarien",
    onboardingNoMeatFish: "Pas de viande ni de poisson",
    onboardingVegan: "Végan",
    onboardingNoAnimalProducts: "Pas de produits animaux",
    onboardingPescatarian: "Pescétarien",
    onboardingFishNoMeat: "Poisson, pas de viande",
    onboardingNone: "Aucun",
    onboardingEverythingAllowed: "Tout est permis",
    onboardingAllergies: "Allergies & intolérances",
    onboardingMultiSelect: "Sélection multiple possible",
    onboardingGluten: "Gluten",
    onboardingLactose: "Lactose",
    onboardingNuts: "Noix",
    onboardingSoy: "Soja",
    onboardingEggs: "Œufs",
    onboardingCookingExperience: "Expérience culinaire",
    onboardingForRecipeDifficulty: "Pour la difficulté des recettes adaptée",
    onboardingBeginner: "Débutant",
    onboardingSimpleRecipes: "Recettes simples",
    onboardingIntermediate: "Intermédiaire",
    onboardingMediumDishes: "Plats de difficulté moyenne",
    onboardingAdvanced: "Pro",
    onboardingDemandingCuisine: "Cuisine exigeante",
    onboardingActivityLevel: "Niveau d'activité",
    onboardingHowActive: "Quelle est ton activité?",
    onboardingChill: "Tranquille",
    onboardingDeskJob: "Bureau, marche légère",
    onboardingActive: "Actif",
    onboardingRegularWorkouts: "Entraînements réguliers",
    onboardingBeast: "Beast",
    onboardingIntenseTraining: "Entraînement intense",
    onboardingAnalyzingGoals: "Analyse des objectifs",
    onboardingProcessingBodyData: "Traitement des données corporelles",
    onboardingCalculatingTargetWeight: "Calcul du poids cible",
    onboardingDeterminingMacros: "Détermination des macros optimales",
    onboardingCreatingPlan: "Création du plan",
    onboardingYourDailyGoal: "Ton objectif quotidien",
    onboardingPersonalizedForYou: "Personnalisé pour toi",
    onboardingBasedOnScience: "Calcul basé sur les formules scientifiques suivantes:",
    onboardingMifflinFormula: "Formule Mifflin-St Jeor (BMR)",
    onboardingBMRCalculation: "Calcul du métabolisme de base",
    onboardingTDEEFactors: "Facteurs d'activité TDEE",
    onboardingTotalEnergy: "Dépense énergétique totale",
    onboardingProteinRecommendation: "Protéines: 2g/kg de poids corporel",
    onboardingISSNProtein: "Recommandation protéines ISSN",
    onboardingDeficitRule: "Déficit: 7700 kcal/kg",
    onboardingEnergyBalance: "Règle d'équilibre énergétique",
    onboardingLetFridgeDecide: "Laisse ton frigo décider.",
    onboardingBuildMealsFromWhat: "On crée des repas avec ce que tu as déjà.",
    onboardingIllHandlePlanning: "Je m'occupe de la planification. Toi, tu manges.",
    onboardingScanFridgeNow: "Scanner le frigo maintenant",
    onboardingEnableCamera: "Activer la caméra",
    onboardingRequiredForScanning: "Requis pour scanner ton frigo",
    onboardingCameraAccess: "Accès caméra",
    onboardingForFridgeScanning: "Pour scanner le frigo",
    onboardingAllow: "Autoriser",
    onboardingOptionalHealthSync: "Optionnel: Définir poids et objectifs",
    onboardingYourWeeklyPlan: "Ton plan hebdomadaire",
    onboardingPersonalizedMealPlan: "Personnalisé pour tes macros",
    onboardingWithoutFrigy: "Sans Frigy",
    onboardingWithFrigy: "Avec Frigy",
    onboardingNoStructure: "Pas de plan",
    onboardingRandomMeals: "Repas aléatoires",
    onboardingClearPlan: "Plan clair",
    onboardingSuccessRate: "94% de succès",
    onboardingGoalAchievement: "Atteinte des objectifs",
    onboardingFaster: "Plus rapide",
    onboardingSavedPerDay: "Gagné/jour",
    onboardingUsersFaster: "Les utilisateurs atteignent leurs objectifs 2.4x plus vite",
    onboardingYourTransformation: "Ta Transformation",
    onboardingWhatToExpect: "Ce qui t'attend avec Frigy",
    onboardingMoreEnergy: "Plus d'énergie",
    // How it works step
    onboardingHowItWorks: "Comment ça marche",
    onboardingHowItWorksSubtitle: "Deux fonctionnalités, un système",
    onboardingHowItWorksStep1Title: "📷 Scanner le frigo",
    onboardingHowItWorksStep1Desc: "Scanne ce que tu as → Obtiens des recettes instantanées",
    onboardingHowItWorksStep2Title: "📅 Plan hebdomadaire",
    onboardingHowItWorksStep2Desc: "L'IA crée un plan 7 jours → Génère la liste de courses",
    onboardingHowItWorksStep3Title: "🔄 La connexion",
    onboardingHowItWorksStep3Desc: "Après les courses, scanne → Les articles achetés sont cochés",
    onboardingHowItWorksTip: "Astuce: Les recettes scannées peuvent remplacer les repas du plan!",
    
    // Tutorial transition step
    onboardingPerfect: "Parfait",
    onboardingIKnowWhatYouWant: "Je sais ce que tu veux",
    onboardingLetMeShowYou: "Laisse-moi te montrer comment Frigy peut t'aider!",
    onboardingShowMeHow: "Montre-moi comment",
    
    // Tutorial steps (multi-page explanation)
    tutorialIntroTitle: "Comment fonctionne Frigy",
    tutorialIntroSubtitle: "En 6 étapes simples",
    tutorialIntroDesc: "Laisse-nous te montrer étape par étape comment tout fonctionne",
    tutorialScanTitle: "Scanner ton frigo",
    tutorialScanStep: "Étape 1 sur 6",
    tutorialScanDesc1: "Ouvre ton frigo et prends une photo",
    tutorialScanDesc2: "L'IA reconnaît automatiquement tous les ingrédients",
    tutorialScanDesc3: "Tu vois instantanément ce que tu as",
    tutorialRecipesTitle: "Recevoir des recettes",
    tutorialRecipesStep: "Étape 2 sur 6",
    tutorialRecipesDesc1: "L'IA crée des recettes basées sur tes ingrédients",
    tutorialRecipesDesc2: "Adaptées à tes objectifs caloriques",
    tutorialRecipesDesc3: "Avec ton temps de cuisson préféré",
    tutorialMealplanTitle: "Créer un plan hebdo",
    tutorialMealplanStep: "Étape 3 sur 6",
    tutorialMealplanDesc1: "Crée un plan de repas complet sur 7 jours",
    tutorialMealplanDesc2: "Échange des repas individuels",
    tutorialMealplanDesc3: "Les macros sont calculés automatiquement",
    tutorialShoppingTitle: "Liste de courses",
    tutorialShoppingStep: "Étape 4 sur 6",
    tutorialShoppingDesc1: "Tous les ingrédients manquants sont automatiquement listés",
    tutorialShoppingDesc2: "Coche ce que tu as ou achètes",
    tutorialShoppingDesc3: "Après les courses → scanne à nouveau!",
    tutorialCycleTitle: "Comment tout est connecté",
    tutorialCycleStep: "Étape 5 sur 6",
    tutorialCycleDesc1: "Voici le cycle de Frigy",
    tutorialCycleHave: "Ce que tu AS",
    tutorialCycleNeed: "Ce que tu as BESOIN",
    tutorialCycleEat: "Ce que tu vas MANGER",
    tutorialCycleExplain1: "Scanner le frigo montre ce que tu as",
    tutorialCycleExplain2: "Le plan hebdo montre ce que tu mangeras",
    tutorialCycleExplain3: "La liste de courses montre ce qu'il faut acheter",
    tutorialCycleExplain4: "Après les courses, scanne à nouveau → cycle complet!",
    tutorialChatbotTitle: "Ton assistant IA",
    tutorialChatbotStep: "Étape 6 sur 6",
    tutorialChatbotDesc1: "Demande à Frigy tout sur ta nutrition",
    tutorialChatbotDesc2: "Il peut voir tes données et effectuer des actions",
    tutorialChatbotDesc3: "Suivre le poids, ajouter de l'eau, donner des conseils",
    tutorialChatbotHint: "Les utilisateurs Premium ont accès au chatbot IA!",
    tutorialPageIndicator: "Page",
    
    onboardingSaveProgress: "Sauvegarde ta progression",
    onboardingCreateAccount: "Crée un compte pour sauvegarder ton plan",
    onboardingSignInToContinue: "Connecte-toi pour continuer",
    onboardingEmailAddress: "Adresse e-mail",
    onboardingPasswordLabel: "Mot de passe",
    onboardingRegister: "S'inscrire",
    onboardingSignInButton: "Se connecter",
    onboardingAlreadyRegistered: "Déjà inscrit? Connecte-toi ici",
    onboardingNoAccountYet: "Pas encore de compte? Inscris-toi ici",
    onboardingWhyRegister: "Pourquoi s'inscrire?",
    onboardingPlanSaved: "Ton plan personnalisé sera sauvegardé",
    onboardingProgressSynced: "Progression synchronisée sur tous les appareils",
    onboardingAccessRecipes: "Accès à tes recettes & repas",
    onboardingAlreadyLoggedIn: "Déjà connecté - Continuer",
    onboardingChooseYourPlan: "Choisis ton plan",
    onboardingStartFreeOrPremium: "Essaie Premium gratuitement pendant 3 jours",
    onboardingFree: "Premium",
    onboardingWeeklyPlan1x: "Plan hebdo (1x génération)",
    onboardingWaterTrackerFeature: "Suivi d'eau",
    onboarding2ScansPerDay: "2 scans frigo/jour",
    onboardingBasicRecipes: "Suggestions de recettes de base",
    onboardingPremiumLabel: "Premium",
    onboardingUnlimitedScans: "Scans illimités",
    onboardingUnlimitedMealPlans: "Génération de plans illimitée",
    onboardingShoppingLists: "Listes de courses",
    onboardingStatsAndMacros: "Stats & suivi des macros",
    onboardingAIChatbot: "Chatbot IA",
    onboardingMostPopular: "Choix le plus populaire",
    onboardingFreeTrial7Days: "3 jours gratuits",
    onboardingContinue: "Continuer",
    onboardingJoinCommunity: "Rejoindre la communauté",
    onboardingShareRecipes: "Partage des recettes & motive les autres",
    onboardingExploreLater: "Explorer plus tard",
    onboardingYouMadeIt: "Tu as réussi!",
    onboardingFrigyReady: "Frigy est prêt pour toi!",
    onboardingLetsGoContinue: "C'est parti!",
    onboardingSystemReady: "Ton système est prêt.",
    onboardingMacrosStructure: "Macros. Structure. Moins de réflexion.",
    onboardingToDashboard: "Vers le tableau de bord",
    onboardingRegistrationFailed: "Inscription échouée",
    onboardingEmailAlreadyRegistered: "Tu es déjà inscrit avec cet e-mail. Connecte-toi.",
    onboardingSuccessfullyRegistered: "Inscription réussie!",
    onboardingProgressSavedMsg: "Ta progression a été sauvegardée.",
    onboardingLoginFailed: "Connexion échouée",
    onboardingWelcomeBack: "Bon retour!",
    onboardingProgressLoaded: "Ta progression a été chargée.",
    onboardingEnterEmailPassword: "Veuillez entrer l'e-mail et le mot de passe",
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
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
    dispatchLanguageChanged(lang);
  };

  useEffect(() => {
    const saved = localStorage.getItem("app-language");
    if (saved && ["de", "en", "fr"].includes(saved)) {
      setLanguageState(saved as Language);
    }
  }, []);

  const t = { ...translations[language], ...extendedTranslations[language] };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

/** For hooks/utilities outside React tree. */
export function getTranslations(lang: Language): Translations {
  return { ...translations[lang], ...extendedTranslations[lang] };
}

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "de";
  const saved = localStorage.getItem("app-language");
  return saved === "en" || saved === "fr" || saved === "de" ? saved : "de";
}
