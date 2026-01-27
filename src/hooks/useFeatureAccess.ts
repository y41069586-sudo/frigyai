import { useAuth } from '@/contexts/AuthContext';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';

export type Feature = 'meal_plans' | 'shopping_list' | 'tracker_full' | 'water' | 'progress' | 'scan' | 'ai_chatbot' | 'recipes';

export interface FeatureAccessResult {
  canAccess: boolean;
  isLocked: boolean;
  lockReason?: 'not_premium' | 'tracker_not_setup' | 'quota_exceeded';
  message?: string;
}

/**
 * Centralized feature access control
 * Determines if a user can access a specific feature based on:
 * - Subscription status (premium)
 * - Tracker setup status
 * - Feature quotas (for free users)
 */
export const useFeatureAccess = () => {
  const { subscriptionStatus, user } = useAuth();
  const { settings: trackerSettings, isConfigured: trackerSetup } = useTrackerSettings();
  
  const isPremium = subscriptionStatus?.subscribed ?? false;
  const isFreeModeUser = user && !isPremium;

  const canAccessFeature = (feature: Feature): FeatureAccessResult => {
    // Define feature requirements
    const featureRequirements: Record<Feature, { requiresPremium: boolean; requiresTracker: boolean }> = {
      meal_plans: { requiresPremium: true, requiresTracker: true },
      shopping_list: { requiresPremium: true, requiresTracker: true },
      tracker_full: { requiresPremium: true, requiresTracker: false },
      water: { requiresPremium: false, requiresTracker: false },
      progress: { requiresPremium: true, requiresTracker: true },
      scan: { requiresPremium: false, requiresTracker: false },
      ai_chatbot: { requiresPremium: true, requiresTracker: false },
      recipes: { requiresPremium: false, requiresTracker: false },
    };

    const requirements = featureRequirements[feature];

    // Check premium requirement
    if (requirements.requiresPremium && !isPremium) {
      return {
        canAccess: false,
        isLocked: true,
        lockReason: 'not_premium',
        message: 'Dieses Feature ist nur für Premium-Nutzer verfügbar',
      };
    }

    // Check tracker setup requirement
    if (requirements.requiresTracker && !trackerSetup) {
      return {
        canAccess: false,
        isLocked: true,
        lockReason: 'tracker_not_setup',
        message: 'Bitte richte zuerst deinen Tracker ein',
      };
    }

    // Feature is accessible
    return {
      canAccess: true,
      isLocked: false,
    };
  };

  return {
    canAccessFeature,
    isPremium,
    trackerSetup,
    isFreeModeUser,
  };
};
