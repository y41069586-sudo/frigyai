import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingProgress {
  onboarding_complete: boolean;
  user_name?: string | null;
  selected_source?: string | null;
  selected_goal?: string | null;
  selected_cooking?: string | null;
  selected_challenge?: string | null;
  health_sync_choice?: string | null;
  community_joined?: boolean;
}

export const useOnboardingProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Load onboarding progress from database
  const loadProgress = useCallback(async () => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading onboarding progress:', error);
        setProgress(null);
      } else if (data) {
        setProgress({
          onboarding_complete: data.onboarding_complete,
          user_name: data.user_name,
          selected_source: data.selected_source,
          selected_goal: data.selected_goal,
          selected_cooking: data.selected_cooking,
          selected_challenge: data.selected_challenge,
          health_sync_choice: data.health_sync_choice,
          community_joined: data.community_joined,
        });
        
        // Also sync to localStorage for backwards compatibility
        if (data.onboarding_complete) {
          localStorage.setItem('onboardingComplete', 'true');
        }
      } else {
        // No record yet - check localStorage as fallback
        const localComplete = localStorage.getItem('onboardingComplete') === 'true';
        setProgress({ onboarding_complete: localComplete });
      }
    } catch (e) {
      console.error('Failed to load onboarding progress:', e);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save onboarding progress to database
  const saveProgress = useCallback(async (data: Partial<OnboardingProgress>) => {
    if (!user) {
      // Not logged in - save to localStorage and update state
      if (data.onboarding_complete) {
        localStorage.setItem('onboardingComplete', 'true');
      }
      // Update in-memory state to keep UI in sync
      setProgress(prev => prev ? { ...prev, ...data } : { onboarding_complete: false, ...data });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving onboarding progress:', error);
      } else {
        // Update local state
        setProgress(prev => prev ? { ...prev, ...data } : { onboarding_complete: false, ...data });
        
        // Also sync to localStorage
        if (data.onboarding_complete) {
          localStorage.setItem('onboardingComplete', 'true');
        }
      }
    } catch (e) {
      console.error('Failed to save onboarding progress:', e);
    }
  }, [user]);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(async (selectedOptions?: Record<number, string>) => {
    const data: Partial<OnboardingProgress> = {
      onboarding_complete: true,
    };

    // Map slide indices to field names (based on OnboardingFlow slide order)
    // Slide 9 = question-source, Slide 10 = question-goal, Slide 11 = question-cooking, Slide 12 = question-challenge
    if (selectedOptions) {
      if (selectedOptions[9]) data.selected_source = selectedOptions[9];
      if (selectedOptions[10]) data.selected_goal = selectedOptions[10];
      if (selectedOptions[11]) data.selected_cooking = selectedOptions[11];
      if (selectedOptions[12]) data.selected_challenge = selectedOptions[12];
    }

    await saveProgress(data);
  }, [saveProgress]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    loading,
    isComplete: progress?.onboarding_complete ?? false,
    userName: progress?.user_name ?? null,
    saveProgress,
    completeOnboarding,
    loadProgress,
  };
};
