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

  render() {
    if (!this.state.hasError) return this.props.children;

    return <PageLoader />;
  }
}
