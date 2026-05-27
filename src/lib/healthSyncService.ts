import { Capacitor } from "@capacitor/core";
import { getLocalDateISO } from "@/lib/localDate";

export type HealthSyncData = {
  weight?: number;
  steps?: number;
  caloriesBurned?: number;
  date: string;
};

export type HealthSyncAvailability =
  | { ok: true }
  | { ok: false; reason: "web" | "unsupported" | "not_installed" | "plugin_error"; detail?: string };

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function isNativeHealthPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export async function checkHealthSyncAvailability(): Promise<HealthSyncAvailability> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: "web" };
  }

  try {
    if (Capacitor.getPlatform() === "ios") {
      const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
      await CapacitorHealthkit.isAvailable();
      return { ok: true };
    }

    if (Capacitor.getPlatform() === "android") {
      const { HealthConnect } = await import("@devmaxime/capacitor-health-connect");
      const { availability } = await HealthConnect.checkAvailability();
      if (availability === "Available") return { ok: true };
      if (availability === "NotInstalled") return { ok: false, reason: "not_installed" };
      return { ok: false, reason: "unsupported", detail: availability };
    }

    return { ok: false, reason: "unsupported" };
  } catch (e) {
    return {
      ok: false,
      reason: "plugin_error",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function requestNativeHealthPermissions(): Promise<boolean> {
  const availability = await checkHealthSyncAvailability();
  if (!availability.ok) return false;

  try {
    if (Capacitor.getPlatform() === "ios") {
      const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
      await CapacitorHealthkit.requestAuthorization({
        read: ["stepCount", "activeEnergyBurned", "bodyMass"],
        write: ["bodyMass"],
      });
      return true;
    }

    if (Capacitor.getPlatform() === "android") {
      const { HealthConnect } = await import("@devmaxime/capacitor-health-connect");
      await HealthConnect.requestPermissions({
        read: ["Steps", "Weight", "ActivitySession", "TotalCaloriesBurned"],
        write: ["Weight"],
      });
      return true;
    }
  } catch (e) {
    console.error("[healthSync] requestPermissions failed:", e);
  }

  return false;
}

async function syncIos(): Promise<HealthSyncData> {
  const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
  const start = startOfTodayIso();
  const end = nowIso();
  const data: HealthSyncData = { date: end };

  try {
    const mass = await CapacitorHealthkit.getBodyMassEntries({ startDate: start, endDate: end, limit: 5 });
    const sorted = [...(mass.data ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    if (sorted[0]?.value != null) data.weight = sorted[0].value;
  } catch (e) {
    console.warn("[healthSync] iOS weight:", e);
  }

  try {
    const steps = await CapacitorHealthkit.getStatisticsCollection({
      startDate: start,
      endDate: end,
      anchorDate: start,
      interval: { unit: "day", value: 1 },
      quantityTypeSampleName: "stepCount",
    });
    const todaySteps = steps.data?.[steps.data.length - 1]?.value;
    if (todaySteps != null) data.steps = Math.round(todaySteps);
  } catch (e) {
    console.warn("[healthSync] iOS steps:", e);
  }

  return data;
}

async function syncAndroid(): Promise<HealthSyncData> {
  const { HealthConnect } = await import("@devmaxime/capacitor-health-connect");
  const start = startOfTodayIso();
  const end = nowIso();
  const data: HealthSyncData = { date: end };

  try {
    const weightRes = await HealthConnect.readRecords({ start, end, type: "Weight" });
    const records = weightRes.records ?? [];
    const latest = records
      .map((r: { time?: string; startTime?: string; weight?: { inKilograms?: number }; }) => ({
        time: r.time ?? r.startTime ?? "",
        kg: r.weight?.inKilograms,
      }))
      .filter((r) => r.kg != null)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    if (latest[0]?.kg != null) data.weight = latest[0].kg;
  } catch (e) {
    console.warn("[healthSync] Android weight:", e);
  }

  try {
    const stepsRes = await HealthConnect.aggregateRecords({
      start,
      end,
      type: "Steps",
      groupBy: "day",
    });
    const steps = stepsRes.aggregates?.[0]?.value;
    if (steps != null) data.steps = Math.round(steps);
  } catch (e) {
    console.warn("[healthSync] Android steps:", e);
  }

  try {
    const calRes = await HealthConnect.aggregateRecords({
      start,
      end,
      type: "TotalCaloriesBurned",
      groupBy: "day",
    });
    const kcal = calRes.aggregates?.[0]?.value;
    if (kcal != null) data.caloriesBurned = Math.round(kcal);
  } catch (e) {
    console.warn("[healthSync] Android calories:", e);
  }

  return data;
}

/** Liest Gewicht, Schritte & Kalorien aus Apple Health / Health Connect. */
export async function syncNativeHealthData(): Promise<HealthSyncData | null> {
  const availability = await checkHealthSyncAvailability();
  if (!availability.ok) return null;

  if (Capacitor.getPlatform() === "ios") return syncIos();
  if (Capacitor.getPlatform() === "android") return syncAndroid();
  return null;
}

/** Schritte für das Dashboard (HealthDashboard liest `frigy_steps_YYYY-MM-DD`). */
export function persistSyncedSteps(steps: number): void {
  const key = `frigy_steps_${getLocalDateISO()}`;
  localStorage.setItem(key, String(steps));
}
