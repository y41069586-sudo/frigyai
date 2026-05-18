import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  componentDidCatch(error: Error) {
    console.error("[Route Error Boundary]", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gradient-primary px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
          <Card className="w-full border-primary/20 bg-white/90 p-5 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Seite konnte nicht geladen werden</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Bitte lade die App neu. Falls alte App-Daten im Cache waren, wird die Seite danach normal geöffnet.
            </p>
            {this.state.error?.message ? (
              <p className="mb-5 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                {this.state.error.message}
              </p>
            ) : null}
            <Button className="w-full gap-2" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              Neu laden
            </Button>
          </Card>
        </div>
      </div>
    );
  }
}
