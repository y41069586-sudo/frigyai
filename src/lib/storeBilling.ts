import { Capacitor } from "@capacitor/core";
import type { PaywallBillingPlan } from "@/components/onboarding/components/OnboardingPaywallStep";
import { usesStoreBilling } from "@/lib/billingPlatform";
import { openExternalUrl } from "@/lib/openExternalUrl";
import {
  readCachedStoreOfferingPrices,
  resolveRevenueCatUserId,
  writeCachedStoreOfferingPrices,
} from "@/lib/storeOfferingPricesCache";
import { supabase } from "@/integrations/supabase/client";

const ANDROID_PACKAGE = "com.frigy.app";

const ENTITLEMENT_ID = import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID?.trim() || "premium";

type SubscriptionOption = import("@revenuecat/purchases-capacitor").SubscriptionOption;

type PricingPhaseLike = {
  price?: {
    formatted?: string;
    amountMicros?: number;
    currencyCode?: string;
  };
  billingPeriod?: {
    unit?: string;
    value?: number;
    iso8601?: string;
  };
};

type BillingCadence = "monthly" | "yearly";

function getApiKey(): string | null {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return import.meta.env.VITE_REVENUECAT_API_KEY_IOS?.trim() || null;
  }
  if (platform === "android") {
    return import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID?.trim() || null;
  }
  return null;
}

/** Google Play base plan id for the gift / discounted yearly (default: paywall-gift). */
export function getYearlyGiftBasePlanId(): string {
  return (
    import.meta.env.VITE_REVENUECAT_YEARLY_PROMO_BASE_PLAN_ID?.trim() ||
    import.meta.env.VITE_REVENUECAT_YEARLY_PROMO_OFFER_TAG?.trim() ||
    "paywall-gift"
  );
}

function subscriptionOptionMatchesGiftPlan(option: SubscriptionOption): boolean {
  const giftPlanId = getYearlyGiftBasePlanId();
  if (option.id === giftPlanId) return true;
  if (option.id.startsWith(`${giftPlanId}:`)) return true;
  return (option.tags ?? []).includes(giftPlanId);
}

export function isStoreBillingConfigured(): boolean {
  return usesStoreBilling() && Boolean(getApiKey());
}

let configurePromise: Promise<void> | null = null;
let configuredUserId: string | null = null;

const CONFIGURE_TIMEOUT_MS = 12_000;
const OFFERINGS_TIMEOUT_MS = 15_000;
const PREFETCH_TIMEOUT_MS = 20_000;
const OFFERINGS_RETRY_DELAYS_MS = [0, 1_500, 3_500] as const;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function configureStoreBilling(appUserId: string): Promise<void> {
  if (!usesStoreBilling()) return;
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[StoreBilling] Missing VITE_REVENUECAT_API_KEY_IOS / ANDROID");
    return;
  }

  if (configurePromise && configuredUserId === appUserId) {
    try {
      await withTimeout(configurePromise, CONFIGURE_TIMEOUT_MS, "RevenueCat configure");
      return;
    } catch (error) {
      console.warn("[StoreBilling] configure retry after failure:", error);
      configurePromise = null;
      configuredUserId = null;
    }
  }

  if (configurePromise && configuredUserId !== appUserId) {
    try {
      await withTimeout(configurePromise, CONFIGURE_TIMEOUT_MS, "RevenueCat configure");
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      await Purchases.logIn({ appUserID: appUserId });
      configuredUserId = appUserId;
      return;
    } catch (error) {
      console.warn("[StoreBilling] logIn failed, re-configuring:", error);
      configurePromise = null;
      configuredUserId = null;
    }
  }

  configurePromise = (async () => {
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }
    await Purchases.configure({
      apiKey,
      appUserID: appUserId,
    });
    configuredUserId = appUserId;
  })();

  try {
    await withTimeout(configurePromise, CONFIGURE_TIMEOUT_MS, "RevenueCat configure");
  } catch (error) {
    configurePromise = null;
    configuredUserId = null;
    throw error;
  }
}

export async function syncStoreSubscriptionToServer(accessToken: string): Promise<void> {
  const { error } = await supabase.functions.invoke("sync-store-subscription", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (error) {
    console.warn("[StoreBilling] sync-store-subscription failed:", error);
  }
}

type RevenueCatPackage = NonNullable<
  Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.getOfferings>>["current"]
>["availablePackages"][number];

type StoreProductWithOptions = {
  priceString: string;
  price?: number;
  currencyCode?: string;
  pricePerMonthString?: string | null;
  identifier?: string;
  introPrice?: { priceString?: string } | null;
  subscriptionOptions?: SubscriptionOption[] | null;
};

function packageSearchText(pkg: RevenueCatPackage): string {
  const product = pkg.product as { identifier?: string } | undefined;
  const packageType = (pkg as { packageType?: string }).packageType ?? "";
  return `${pkg.identifier} ${product?.identifier ?? ""} ${packageType}`.toLowerCase();
}

function isYearlyLikePackage(pkg: RevenueCatPackage): boolean {
  const hay = packageSearchText(pkg);
  const packageType = ((pkg as { packageType?: string }).packageType ?? "").toUpperCase();
  return (
    packageType === "ANNUAL" ||
    pkg.identifier === "$rc_annual" ||
    pkg.identifier === "annual" ||
    /(?:^|[^a-z])(?:annual|yearly|year|jahres|rc_annual)(?:[^a-z]|$)/i.test(hay)
  );
}

function isMonthlyLikePackage(pkg: RevenueCatPackage): boolean {
  const hay = packageSearchText(pkg);
  const packageType = ((pkg as { packageType?: string }).packageType ?? "").toUpperCase();
  return (
    packageType === "MONTHLY" ||
    pkg.identifier === "$rc_monthly" ||
    pkg.identifier === "monthly" ||
    /(?:^|[^a-z])(?:monthly|month|monat|rc_monthly)(?:[^a-z]|$)/i.test(hay)
  );
}

function packageTypeOf(pkg: RevenueCatPackage): string {
  return ((pkg as { packageType?: string }).packageType ?? "").toUpperCase();
}

function subscriptionOptionBillingCadence(option: SubscriptionOption): BillingCadence | null {
  const period =
    (option as { billingPeriod?: PricingPhaseLike["billingPeriod"] }).billingPeriod ??
    (option.fullPricePhase as PricingPhaseLike | null | undefined)?.billingPeriod;

  const iso = period?.iso8601?.trim().toUpperCase() ?? "";
  if (iso === "P1Y" || /^P\d+Y$/.test(iso)) return "yearly";
  if (iso === "P1M" || /^P\d+M$/.test(iso)) {
    const months = iso === "P1M" ? 1 : Number.parseInt(iso.slice(1, -1), 10);
    if (months >= 12) return "yearly";
    if (months === 1) return "monthly";
  }

  const unit = period?.unit?.toUpperCase() ?? "";
  if (unit === "YEAR") return "yearly";
  if (unit === "MONTH" && (period?.value ?? 1) >= 12) return "yearly";
  if (unit === "MONTH") return "monthly";

  const id = option.id.toLowerCase();
  if (/(year|annual|jahres)/.test(id)) return "yearly";
  if (/(month|monat)/.test(id)) return "monthly";
  return null;
}

function packageBillingCadence(pkg: RevenueCatPackage): BillingCadence | null {
  const packageType = packageTypeOf(pkg);
  if (packageType === "MONTHLY") return "monthly";
  if (packageType === "ANNUAL") return "yearly";

  const yearlyLike = isYearlyLikePackage(pkg);
  const monthlyLike = isMonthlyLikePackage(pkg);
  if (yearlyLike && !monthlyLike) return "yearly";
  if (monthlyLike && !yearlyLike) return "monthly";

  if (Capacitor.getPlatform() === "android") {
    const product = pkg.product as StoreProductWithOptions;
    const options = product.subscriptionOptions ?? [];
    const basePlans = options.filter((option) => option.isBasePlan);
    const cadences = basePlans
      .map((option) => subscriptionOptionBillingCadence(option))
      .filter((cadence): cadence is BillingCadence => cadence !== null);
    if (cadences.length === 1) return cadences[0]!;
    if (cadences.includes("yearly") && !cadences.includes("monthly")) return "yearly";
    if (cadences.includes("monthly") && !cadences.includes("yearly")) return "monthly";
  }

  return null;
}

function packageMatchesPlan(pkg: RevenueCatPackage, plan: PaywallBillingPlan): boolean {
  const cadence = packageBillingCadence(pkg);
  if (plan === "monthly") {
    if (cadence === "monthly") return true;
    if (cadence === "yearly") return false;
    return isMonthlyLikePackage(pkg) && !isYearlyLikePackage(pkg);
  }
  if (plan === "yearly" || plan === "yearly_promo") {
    if (cadence === "yearly") return true;
    if (cadence === "monthly") return false;
    return isYearlyLikePackage(pkg) && !isMonthlyLikePackage(pkg);
  }
  return false;
}

/** Gift yearly: Google Play base plan paywall-gift (or offer on that plan). */
export function findGiftSubscriptionOption(pkg: RevenueCatPackage): SubscriptionOption | null {
  const product = pkg.product as StoreProductWithOptions;
  const options = product.subscriptionOptions ?? [];
  if (options.length === 0) return null;

  const giftPlanId = getYearlyGiftBasePlanId();
  const giftBasePlan = options.find((option) => option.isBasePlan && option.id === giftPlanId);
  if (giftBasePlan) return giftBasePlan;

  return options.find((option) => subscriptionOptionMatchesGiftPlan(option)) ?? null;
}

/** Standard yearly base plan — excludes paywall-gift. */
export function findStandardYearlySubscriptionOption(
  pkg: RevenueCatPackage,
): SubscriptionOption | null {
  const product = pkg.product as StoreProductWithOptions;
  const options = product.subscriptionOptions ?? [];
  if (options.length === 0) return null;

  const standardBasePlans = options.filter(
    (option) => option.isBasePlan && !subscriptionOptionMatchesGiftPlan(option),
  );
  if (standardBasePlans.length === 1) return standardBasePlans[0];

  return (
    options.find((option) => option.isBasePlan && !subscriptionOptionMatchesGiftPlan(option)) ??
    null
  );
}

function scorePackageForPlan(pkg: RevenueCatPackage, plan: PaywallBillingPlan): number {
  const cadence = packageBillingCadence(pkg);
  const isYearlyLike = isYearlyLikePackage(pkg);
  const isMonthlyLike = isMonthlyLikePackage(pkg);

  if (plan === "yearly" || plan === "yearly_promo") {
    if (cadence === "yearly") return 110;
    if (cadence === "monthly") return -110;
    if (pkg.identifier === "$rc_annual" || pkg.identifier === "annual") return 100;
    if (packageTypeOf(pkg) === "ANNUAL") return 95;
    if (isMonthlyLike && !isYearlyLike) return -100;
    if (isYearlyLike) return 80;
    return 0;
  }

  if (cadence === "monthly") return 110;
  if (cadence === "yearly") return -110;
  if (isYearlyLike) return -100;
  if (pkg.identifier === "$rc_monthly" || pkg.identifier === "monthly") return 100;
  if (packageTypeOf(pkg) === "MONTHLY") return 95;
  if (isMonthlyLike) return 80;
  return 0;
}

function collectOfferingPackages(
  offerings: Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.getOfferings>>,
): RevenueCatPackage[] {
  const current = offerings.current;
  if (!current) return [];

  const candidates = new Map<string, RevenueCatPackage>();
  for (const pkg of current.availablePackages ?? []) {
    candidates.set(pkg.identifier, pkg);
  }
  if (current.monthly) candidates.set(current.monthly.identifier, current.monthly);
  if (current.annual) candidates.set(current.annual.identifier, current.annual);

  return [...candidates.values()];
}

function pickPackageFromCurrentOffering(
  offerings: Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.getOfferings>>,
  plan: PaywallBillingPlan,
): RevenueCatPackage | null {
  const current = offerings.current;
  if (!current) return null;

  if (plan === "monthly" && current.monthly && packageMatchesPlan(current.monthly, plan)) {
    return current.monthly;
  }
  if (
    (plan === "yearly" || plan === "yearly_promo") &&
    current.annual &&
    packageMatchesPlan(current.annual, plan)
  ) {
    return current.annual;
  }

  return null;
}

function pickPackage(
  offerings: Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.getOfferings>>,
  plan: PaywallBillingPlan,
) {
  const direct = pickPackageFromCurrentOffering(offerings, plan);
  if (direct) return direct;

  const packages = collectOfferingPackages(offerings);
  if (packages.length === 0) return null;

  let best: RevenueCatPackage | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  let viableCount = 0;

  for (const pkg of packages) {
    const score = scorePackageForPlan(pkg, plan);
    if (score >= 0) viableCount += 1;
    if (score > bestScore) {
      bestScore = score;
      best = pkg;
    }
  }

  if (import.meta.env.DEV && best) {
    console.info("[StoreBilling] pickPackage", {
      plan,
      picked: best.identifier,
      productId: (best.product as { identifier?: string } | undefined)?.identifier,
      score: bestScore,
      viableCount,
      offeringId: offerings.current?.identifier,
    });
  }

  if (!best) return null;
  if (bestScore > 0) return best;
  if (bestScore === 0 && viableCount === 1) return best;
  return null;
}

export type StorePlanPrice = {
  /** Localized price from the store (matches the purchase dialog). */
  priceString: string;
  price?: number;
  currencyCode?: string;
  pricePerMonthString?: string | null;
  hasIntroOffer: boolean;
  introPriceString?: string | null;
  productIdentifier?: string;
  packageIdentifier?: string;
};

export type StoreOfferingPrices = {
  monthly: StorePlanPrice | null;
  yearly: StorePlanPrice | null;
  /** Discounted yearly via Google Play subscription offer on the same product. */
  yearlyPromo: StorePlanPrice | null;
};

function phasePriceString(phase: PricingPhaseLike | null | undefined): string | null {
  return phase?.price?.formatted?.trim() || null;
}

function phasePriceAmount(phase: PricingPhaseLike | null | undefined): number | undefined {
  const micros = phase?.price?.amountMicros;
  return typeof micros === "number" ? micros / 1_000_000 : undefined;
}

function findSubscriptionOptionForCadence(
  pkg: RevenueCatPackage,
  cadence: BillingCadence,
): SubscriptionOption | null {
  const product = pkg.product as StoreProductWithOptions;
  const options = product.subscriptionOptions ?? [];
  if (options.length === 0) return null;

  const matching = options.filter((option) => subscriptionOptionBillingCadence(option) === cadence);
  if (matching.length > 0) {
    return matching.find((option) => option.isBasePlan) ?? matching[0] ?? null;
  }

  if (cadence === "yearly") {
    return findStandardYearlySubscriptionOption(pkg);
  }

  const nonGiftBase = options.find(
    (option) => option.isBasePlan && !subscriptionOptionMatchesGiftPlan(option),
  );
  return nonGiftBase ?? options.find((option) => option.isBasePlan) ?? options[0] ?? null;
}

function mapPackagePrice(
  pkg: RevenueCatPackage | null,
  cadence: BillingCadence = "monthly",
): StorePlanPrice | null {
  if (!pkg?.product) return null;

  if (Capacitor.getPlatform() === "android") {
    const option = findSubscriptionOptionForCadence(pkg, cadence);
    if (option) {
      const fromOption = mapSubscriptionOptionPrice(pkg, option);
      if (fromOption?.priceString) return fromOption;
    }
  }

  const product = pkg.product as StoreProductWithOptions;
  const priceString = product.priceString?.trim();
  if (!priceString) return null;

  return {
    priceString,
    price: typeof product.price === "number" ? product.price : undefined,
    currencyCode: product.currencyCode,
    pricePerMonthString: product.pricePerMonthString ?? null,
    hasIntroOffer: Boolean(product.introPrice),
    introPriceString: product.introPrice?.priceString ?? null,
    productIdentifier: product.identifier,
    packageIdentifier: pkg.identifier,
  };
}

function mapSubscriptionOptionPrice(
  yearlyPkg: RevenueCatPackage,
  option: SubscriptionOption,
): StorePlanPrice | null {
  const introPhase = option.introPhase as PricingPhaseLike | null | undefined;
  const fullPhase = option.fullPricePhase as PricingPhaseLike | null | undefined;
  const firstPhase = (option.pricingPhases?.[0] ?? null) as PricingPhaseLike | null;

  const priceString =
    phasePriceString(introPhase) ||
    phasePriceString(fullPhase) ||
    phasePriceString(firstPhase);
  if (!priceString) return null;

  const price =
    phasePriceAmount(introPhase) ??
    phasePriceAmount(fullPhase) ??
    phasePriceAmount(firstPhase);
  const product = yearlyPkg.product as StoreProductWithOptions;

  return {
    priceString,
    price,
    currencyCode:
      introPhase?.price?.currencyCode ??
      fullPhase?.price?.currencyCode ??
      firstPhase?.price?.currencyCode ??
      product.currencyCode,
    hasIntroOffer: Boolean(introPhase),
    introPriceString: phasePriceString(introPhase) ?? undefined,
    productIdentifier: product.identifier,
    packageIdentifier: yearlyPkg.identifier,
  };
}

function mapYearlyStandardPrice(yearlyPkg: RevenueCatPackage | null): StorePlanPrice | null {
  if (!yearlyPkg) return null;

  if (Capacitor.getPlatform() === "android") {
    const standardOption = findStandardYearlySubscriptionOption(yearlyPkg);
    if (standardOption) {
      return mapSubscriptionOptionPrice(yearlyPkg, standardOption);
    }
  }

  return mapPackagePrice(yearlyPkg, "yearly");
}

function mapGiftOfferPrice(
  yearlyPkg: RevenueCatPackage,
  giftOption: SubscriptionOption,
): StorePlanPrice | null {
  return mapSubscriptionOptionPrice(yearlyPkg, giftOption);
}

function resolveYearlyPromoPrice(yearlyPkg: RevenueCatPackage | null): StorePlanPrice | null {
  if (!yearlyPkg) return null;
  const giftOption = findGiftSubscriptionOption(yearlyPkg);
  if (!giftOption) return null;
  return mapGiftOfferPrice(yearlyPkg, giftOption);
}

type StoreOfferings = Awaited<
  ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.getOfferings>
>;

async function loadStoreOfferings(): Promise<StoreOfferings> {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  try {
    return await Purchases.syncAttributesAndOfferingsIfNeeded();
  } catch (error) {
    console.warn("[StoreBilling] syncAttributesAndOfferingsIfNeeded failed, using getOfferings:", error);
    return Purchases.getOfferings();
  }
}

function logOfferingSnapshot(offerings: StoreOfferings): void {
  const current = offerings.current;
  if (!current) {
    console.warn("[StoreBilling] RevenueCat offerings.current is empty — check dashboard Offering + products.");
    return;
  }

  if (!import.meta.env.DEV) return;

  console.info("[StoreBilling] offerings snapshot", {
    offeringId: current.identifier,
    monthly: current.monthly?.identifier ?? null,
    annual: current.annual?.identifier ?? null,
    packages: (current.availablePackages ?? []).map((pkg) => ({
      id: pkg.identifier,
      productId: (pkg.product as { identifier?: string } | undefined)?.identifier,
      priceString: (pkg.product as StoreProductWithOptions | undefined)?.priceString ?? null,
      currencyCode: (pkg.product as StoreProductWithOptions | undefined)?.currencyCode ?? null,
    })),
  });
}

function correctSwappedMonthlyYearlyPrices(prices: StoreOfferingPrices): StoreOfferingPrices {
  const monthlyAmount = prices.monthly?.price;
  const yearlyAmount = prices.yearly?.price;
  if (
    typeof monthlyAmount === "number" &&
    typeof yearlyAmount === "number" &&
    monthlyAmount > yearlyAmount
  ) {
    console.warn(
      "[StoreBilling] Monthly/yearly prices look swapped — correcting by amount (check RevenueCat Offering packages).",
    );
    return {
      monthly: prices.yearly,
      yearly: prices.monthly,
      yearlyPromo: prices.yearlyPromo,
    };
  }
  return prices;
}

function mapOfferingPrices(offerings: StoreOfferings): StoreOfferingPrices {
  const monthlyPkg = pickPackage(offerings, "monthly");
  const yearlyPkg = pickPackage(offerings, "yearly");

  if (import.meta.env.DEV) {
    console.info("[StoreBilling] mapOfferingPrices", {
      monthly: monthlyPkg
        ? {
            id: monthlyPkg.identifier,
            productId: (monthlyPkg.product as { identifier?: string } | undefined)?.identifier,
            cadence: packageBillingCadence(monthlyPkg),
          }
        : null,
      yearly: yearlyPkg
        ? {
            id: yearlyPkg.identifier,
            productId: (yearlyPkg.product as { identifier?: string } | undefined)?.identifier,
            cadence: packageBillingCadence(yearlyPkg),
          }
        : null,
    });
  }

  return correctSwappedMonthlyYearlyPrices({
    monthly: mapPackagePrice(monthlyPkg, "monthly"),
    yearly: mapYearlyStandardPrice(yearlyPkg),
    yearlyPromo: resolveYearlyPromoPrice(yearlyPkg),
  });
}

function hasCompleteStorePrices(prices: StoreOfferingPrices | null | undefined): boolean {
  return Boolean(prices?.monthly?.priceString && prices?.yearly?.priceString);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Live App Store / Play prices from RevenueCat offerings (localized by store region). */
export async function fetchStoreOfferingPrices(
  userId?: string | null,
): Promise<StoreOfferingPrices | null> {
  if (!isStoreBillingConfigured()) return null;

  const appUserId = resolveRevenueCatUserId(userId);

  try {
    await configureStoreBilling(appUserId);
    const offerings = await withTimeout(loadStoreOfferings(), OFFERINGS_TIMEOUT_MS, "RevenueCat offerings");
    logOfferingSnapshot(offerings);
    return mapOfferingPrices(offerings);
  } catch (e) {
    console.warn("[StoreBilling] fetchStoreOfferingPrices failed:", e);
    return null;
  }
}

/** Retry offerings fetch — store prices can lag right after configure on cold start. */
export async function fetchStoreOfferingPricesWithRetry(
  userId?: string | null,
): Promise<StoreOfferingPrices | null> {
  let last: StoreOfferingPrices | null = null;

  for (const delayMs of OFFERINGS_RETRY_DELAYS_MS) {
    if (delayMs > 0) await sleep(delayMs);
    last = await fetchStoreOfferingPrices(userId);
    if (hasCompleteStorePrices(last)) return last;
  }

  return last;
}

const prefetchInflight = new Map<string, Promise<StoreOfferingPrices | null>>();

async function withPrefetchTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type PrefetchStoreOfferingPricesOptions = {
  force?: boolean;
};

/** Background load of store prices — call on app start and when user signs in. */
export async function prefetchStoreOfferingPrices(
  userId?: string | null,
  options?: PrefetchStoreOfferingPricesOptions,
): Promise<StoreOfferingPrices | null> {
  if (!isStoreBillingConfigured()) {
    return readCachedStoreOfferingPrices();
  }

  const appUserId = resolveRevenueCatUserId(userId);
  const inflightKey = `${appUserId}:${options?.force ? "force" : "default"}`;
  const inflight = prefetchInflight.get(inflightKey);
  if (inflight && !options?.force) return inflight;

  const promise = (async () => {
    try {
      const fetched = await withPrefetchTimeout(
        fetchStoreOfferingPricesWithRetry(userId),
        PREFETCH_TIMEOUT_MS,
      );
      if (fetched) {
        writeCachedStoreOfferingPrices(fetched);
      }
      if (hasCompleteStorePrices(fetched)) return fetched;
      return readCachedStoreOfferingPrices();
    } catch (error) {
      console.warn("[StoreBilling] prefetchStoreOfferingPrices failed:", error);
      return readCachedStoreOfferingPrices();
    }
  })().finally(() => {
    prefetchInflight.delete(inflightKey);
  });

  prefetchInflight.set(inflightKey, promise);
  return promise;
}

export type StorePurchaseResult =
  | { ok: true }
  | { ok: false; cancelled?: boolean; message?: string };

async function purchaseSubscriptionOptionOnAndroid(
  yearlyPkg: RevenueCatPackage,
  option: SubscriptionOption,
): Promise<
  Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.purchaseSubscriptionOption>>
> {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  return Purchases.purchaseSubscriptionOption({ subscriptionOption: option });
}

async function purchaseGiftYearlyOffer(
  offerings: Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.getOfferings>>,
): Promise<Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.purchaseSubscriptionOption>> | null> {
  const yearlyPkg = pickPackage(offerings, "yearly");
  if (!yearlyPkg) return null;

  const giftOption = findGiftSubscriptionOption(yearlyPkg);
  if (!giftOption) return null;

  if (Capacitor.getPlatform() === "android") {
    return purchaseSubscriptionOptionOnAndroid(yearlyPkg, giftOption);
  }

  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  return Purchases.purchasePackage({ aPackage: yearlyPkg });
}

async function purchaseStandardYearly(
  offerings: Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.getOfferings>>,
): Promise<
  | Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.purchasePackage>>
  | Awaited<ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.purchaseSubscriptionOption>>
  | null
> {
  const yearlyPkg = pickPackage(offerings, "yearly");
  if (!yearlyPkg) return null;

  if (Capacitor.getPlatform() === "android") {
    const standardOption = findStandardYearlySubscriptionOption(yearlyPkg);
    if (standardOption) {
      return purchaseSubscriptionOptionOnAndroid(yearlyPkg, standardOption);
    }
  }

  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  return Purchases.purchasePackage({ aPackage: yearlyPkg });
}

export async function purchaseStorePlan(
  plan: PaywallBillingPlan,
  accessToken: string,
  userId?: string | null,
): Promise<StorePurchaseResult> {
  if (!isStoreBillingConfigured()) {
    return {
      ok: false,
      message: "App Store / Play Abo ist noch nicht konfiguriert (RevenueCat API Keys fehlen).",
    };
  }

  const giftPlanId = getYearlyGiftBasePlanId();

  try {
    await configureStoreBilling(resolveRevenueCatUserId(userId));
    const offerings = await loadStoreOfferings();

    let customerInfo: Awaited<
      ReturnType<typeof import("@revenuecat/purchases-capacitor").Purchases.purchasePackage>
    >["customerInfo"];

    if (plan === "yearly_promo") {
      const giftResult = await purchaseGiftYearlyOffer(offerings);
      if (!giftResult) {
        return {
          ok: false,
          message: `Kein Play Base Plan „${giftPlanId}" auf dem Jahresabo gefunden. Prüfe Play Console und RevenueCat.`,
        };
      }
      customerInfo = giftResult.customerInfo;
    } else if (plan === "yearly") {
      const yearlyResult = await purchaseStandardYearly(offerings);
      if (!yearlyResult) {
        return { ok: false, message: "Kein Jahresabo in RevenueCat gefunden." };
      }
      customerInfo = yearlyResult.customerInfo;
    } else {
      const pkg = pickPackage(offerings, plan);
      if (!pkg) {
        return { ok: false, message: "Kein Abo-Paket in RevenueCat gefunden (Offering monthly/yearly)." };
      }
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      customerInfo = result.customerInfo;
    }

    const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!active) {
      return { ok: false, message: "Kauf abgeschlossen, aber Premium-Entitlement fehlt." };
    }

    await syncStoreSubscriptionToServer(accessToken);
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; userCancelled?: boolean };
    if (err?.userCancelled || err?.code === "1" || /cancel/i.test(String(err?.message || ""))) {
      return { ok: false, cancelled: true };
    }
    return { ok: false, message: err?.message || "Store-Kauf fehlgeschlagen." };
  }
}

/** Opens App Store / Play Store subscription management (required for store-billed users). */
export async function openStoreSubscriptionManagement(): Promise<void> {
  const platform = Capacitor.getPlatform();
  const url =
    platform === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`;
  await openExternalUrl(url);
}

export async function restoreStorePurchases(accessToken: string): Promise<StorePurchaseResult> {
  if (!isStoreBillingConfigured()) {
    return { ok: false, message: "Store-Wiederherstellung nicht verfügbar." };
  }

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.restorePurchases();
    const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!active) {
      return { ok: false, message: "Kein aktives Abo gefunden." };
    }
    await syncStoreSubscriptionToServer(accessToken);
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Wiederherstellung fehlgeschlagen.";
    return { ok: false, message };
  }
}
