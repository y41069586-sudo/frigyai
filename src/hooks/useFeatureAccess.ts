import { useAuth } from '@/contexts/AuthContext';
import { useTrackerSettings } from '@/hooks/useTrackerSettings';

export type Feature = 'meal_plans' | 'shopping_list' | 'tracker_full' | 'water' | 'progress' | 'scan' | 'ai_chatbot' | 'recipes';

export interface FeatureAccessResult {
  canAccess: boolean;
  isLocked: boolean;
  message?: string;
}

/**
 * Centralized feature access control
 * Determines if a user can access a specific feature based on:
 * - Subscription status (premium)
 * - Tracker setup status
 */
export const useFeatureAccess = () => {
  const { isPremium } = useAuth();
  const { isConfigured: trackerSetup } = useTrackerSettings();

  const canAccessFeature = (_feature: Feature): FeatureAccessResult => {
    if (isPremium) {
      return { canAccess: true, isLocked: false };
    }
    return {
      canAccess: false,
      isLocked: true,
      message: 'Premium erforderlich',
    };
  };

  return {
    canAccessFeature,
    isPremium,
    trackerSetup,
  };
};
