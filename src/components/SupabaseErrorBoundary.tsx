import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export class SupabaseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[Supabase Error Boundary]', error);
    
    // Check if this is a Supabase initialization error
    if (error.message?.includes('Supabase') || error.message?.includes('createClient')) {
      console.error('[Supabase] Initialization failed - check your environment variables');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
          <Card className="w-full max-w-md p-6 glass-card shadow-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-destructive/10 p-2 rounded-full">
                <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Setup Erforderlich</h2>
                <p className="text-sm text-muted-foreground">Supabase Konfiguration fehlt</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-destructive/20">
              <p className="text-xs font-mono text-destructive break-words">
                {this.state.error?.message || 'Unbekannter Fehler'}
              </p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground mb-6">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <p className="font-semibold text-foreground mb-2">Anleitung für Builder.io:</p>
                <ol className="list-decimal list-inside space-y-2 text-xs">
                  <li>Gehe zu <strong>Project Settings</strong> in Builder.io</li>
                  <li>Scrolle zu <strong>Environment Variables</strong> (NICHT Secrets)</li>
                  <li>Füge <code>VITE_SUPABASE_URL</code> hinzu</li>
                  <li>Füge <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> hinzu</li>
                  <li>Speichere und klicke auf <strong>Deploy</strong></li>
                </ol>
              </div>

              <div className="text-xs space-y-1">
                <p><strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Nicht konfiguriert'}</p>
                <p className="truncate"><strong>Key:</strong> {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Vorhanden' : 'Nicht konfiguriert'}</p>
              </div>
            </div>

            <Button
              onClick={() => window.location.reload()}
              className="w-full glow-button"
            >
              Seite neu laden
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
