import React from 'react';
import { PageLoader } from '@/components/PageLoader';
import { attemptRuntimeRecovery, resetRuntimeRecovery } from '@/lib/runtimeRecovery';

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

  private handleRetry = () => {
    resetRuntimeRecovery(SupabaseErrorBoundary.RECOVERY_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (import.meta.env.DEV) {
        const message = this.state.error?.message ?? "Unbekannter Fehler";
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-lg">
              <h1 className="text-lg font-bold mb-2">App-Start fehlgeschlagen</h1>
              <p className="text-sm text-muted-foreground mb-4 break-words">{message}</p>
              <button
                type="button"
                className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={this.handleRetry}
              >
                Neu laden
              </button>
            </div>
          </div>
        );
      }
      return <PageLoader />;
    }

    return this.props.children;
  }
}
