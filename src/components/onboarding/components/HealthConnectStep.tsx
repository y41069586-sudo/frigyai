import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import healthSyncHero from "@/assets/health-sync-hero.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHealthConnect } from "@/hooks/useHealthConnect";
import { MINT_STEP_HEADER_PT } from "../layout";
import type { UserData } from "../types";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingMascotQuestion } from "./OnboardingMascotQuestion";

type Props = {
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  onBack?: () => void;
  onNext?: () => void;
};

/** Sampled from health-sync-hero.png background pixels (mode: 127, 216, 182). */
const HEALTH_SYNC_HERO_BG = "rgb(127, 216, 182)";

const PALETTE = {
  primary: "#20D86B",
  primaryDark: "#0EA84E",
  activateBg: "#20D86B",
  text: "#1F2937",
  subtext: "#4B5563",
};

export function HealthConnectStep({ userData, setUserData, onBack, onNext }: Props) {
  const { language } = useLanguage();
  const { isNativeApp, platform, requestPermissions, isLoading } = useHealthConnect();
  const [connecting, setConnecting] = useState(false);
  const providerName =
    platform === "ios" ? "Apple Health" : platform === "android" ? "Health Connect" : "Health Sync";
  const syncValue =
    platform === "ios" ? "apple-health" : platform === "android" ? "health-connect" : null;

  const L = {
    de: {
      question: `${providerName} verbinden`,
      body: isNativeApp
        ? `Erlaube Frigy den Zugriff auf ${providerName}, damit Schritte, Gewicht und Aktivitätsdaten automatisch synchronisiert werden.`
        : "Bitte erlaube Frigy, deine Apple-Health-Daten zu synchronisieren, um eine genaue Kalorienberechnung zu erhalten.",
      notNow: "Nicht jetzt",
      activate: "Aktivieren",
      back: "Zurück",
    },
    en: {
      question: `Connect ${providerName}`,
      body: isNativeApp
        ? `Allow Frigy to access ${providerName} so steps, weight and activity data can sync automatically.`
        : "Please allow Frigy to sync your Apple Health data for accurate calorie calculations.",
      notNow: "Not now",
      activate: "Activate",
      back: "Back",
    },
    fr: {
      question: `Connecter ${providerName}`,
      body: isNativeApp
        ? `Autorise Frigy à accéder à ${providerName} pour synchroniser automatiquement les pas, le poids et l'activité.`
        : "Autorise Frigy à synchroniser tes données Apple Health pour un calcul précis des calories.",
      notNow: "Pas maintenant",
      activate: "Activer",
      back: "Retour",
    },
  } as const;

  const t = L[language as keyof typeof L] ?? L.de;

  const activate = async () => {
    setConnecting(true);
    if (!isNativeApp) {
      setUserData({ ...userData, healthSync: null });
      setConnecting(false);
      onNext?.();
      return;
    }

    const granted = await requestPermissions();
    if (granted) {
      setUserData({ ...userData, healthSync: syncValue });
      setConnecting(false);
      onNext?.();
      return;
    }

    setConnecting(false);
  };

  const skip = () => {
    setUserData({ ...userData, healthSync: null });
    onNext?.();
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white">
      <motion.div
        className="flex min-h-0 flex-1 flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ backgroundColor: HEALTH_SYNC_HERO_BG }}
      >
        <div
          className="flex shrink-0 items-center px-5 pb-2"
          style={{ paddingTop: MINT_STEP_HEADER_PT }}
        >
          {onBack ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={onBack}
              aria-label={t.back}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/90 text-neutral-600"
            >
              <ChevronLeft className="size-5" />
            </motion.button>
          ) : (
            <div className="h-9 w-9" aria-hidden />
          )}
        </div>

        <div
          role="img"
          aria-label="Apple Health Verbindung"
          className="min-h-0 flex-1 bg-center bg-no-repeat"
          style={{
            backgroundColor: HEALTH_SYNC_HERO_BG,
            backgroundImage: `url(${healthSyncHero})`,
            backgroundSize: "contain",
          }}
        />

        <div className="shrink-0 bg-white px-5 pb-4 pt-4">
          <OnboardingMascotQuestion className="px-0">
            <p
              className="text-[17px] font-bold uppercase leading-snug tracking-wide"
              style={{ color: PALETTE.text }}
            >
              {t.question}
            </p>
          </OnboardingMascotQuestion>

          <p
            className="mt-2 px-1 text-[14px] leading-relaxed"
            style={{ color: PALETTE.subtext }}
          >
            {t.body}
          </p>
        </div>
      </motion.div>

      <div className="shrink-0 border-t border-neutral-200 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px)+1rem)] pt-3">
        <div className="flex w-full overflow-hidden rounded-[18px] border-2 border-neutral-900">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={skip}
            className="flex h-14 min-w-0 flex-1 items-center justify-center bg-white px-3 text-[16px] font-semibold text-neutral-900"
          >
            {t.notNow}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={activate}
            disabled={connecting || isLoading}
            className="flex h-14 min-w-0 flex-1 items-center justify-center px-3 text-[16px] font-semibold disabled:opacity-70"
            style={{
              backgroundColor: PALETTE.activateBg,
              color: "#FFFFFF",
            }}
          >
            {connecting || isLoading ? "…" : t.activate}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
