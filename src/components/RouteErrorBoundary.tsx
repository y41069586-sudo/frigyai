import React from "react";
import { PageLoader } from "@/components/PageLoader";
import { attemptRuntimeRecovery, resetRuntimeRecovery } from "@/lib/runtimeRecovery";

type RouteErrorBoundaryProps = {
  children: React.ReactNode;
  resetKey: string;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  private static readonly RECOVERY_KEY = "frigy_route_boundary_recovery_attempted";
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      resetRuntimeRecovery(RouteErrorBoundary.RECOVERY_KEY);
      this.setState({ hasError: false, error: undefined });
    }
  }

  componentDidCatch(error: Error) {
    console.error("[Route Error Boundary]", error);
    attemptRuntimeRecovery(RouteErrorBoundary.RECOVERY_KEY);
  }

  private handleRetry = () => {
    resetRuntimeRecovery(RouteErrorBoundary.RECOVERY_KEY);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (import.meta.env.DEV) {
      const message = this.state.error?.message ?? "Unbekannter Fehler";
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-lg">
            <h1 className="text-lg font-bold mb-2">Seite konnte nicht geladen werden</h1>
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
}
