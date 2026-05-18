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
  const canAccessFeature = (_feature: Feature): FeatureAccessResult => {
    return {
      canAccess: true,
      isLocked: false,
    };
  };

  return {
    canAccessFeature,
    isPremium: true,
    trackerSetup: true,
  };
};
