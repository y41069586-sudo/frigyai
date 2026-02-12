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
        <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
          <Card className="w-full max-w-md p-6 bg-card/80 backdrop-blur-lg">
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Configuration Error</h2>
                <p className="text-sm text-muted-foreground">Supabase initialization failed</p>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-destructive/20">
              <p className="text-sm font-mono text-muted-foreground break-words">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground mb-4">
              <p>Please check the following:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>VITE_SUPABASE_URL is set in your environment</li>
                <li>VITE_SUPABASE_PUBLISHABLE_KEY is set in your environment</li>
                <li>The values are not empty or invalid</li>
              </ul>
            </div>

            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Reload Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
