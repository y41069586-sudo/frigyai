import React from 'react';
import { PageLoader } from '@/components/PageLoader';
import { attemptRuntimeRecovery } from '@/lib/runtimeRecovery';

export class SupabaseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  private static readonly RECOVERY_KEY = 'frigy_supabase_boundary_recovery_attempted';

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[Supabase Error Boundary]', error);
    attemptRuntimeRecovery(SupabaseErrorBoundary.RECOVERY_KEY);
    
    // Check if this is a Supabase initialization error
    if (error.message?.includes('Supabase') || error.message?.includes('createClient')) {
      console.error('[Supabase] Initialization failed - check your environment variables');
    }
  }

  render() {
    if (this.state.hasError) {
      return <PageLoader />;
    }

    return this.props.children;
  }
}
