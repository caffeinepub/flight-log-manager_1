import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Plane, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginScreen() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const isError = loginStatus === 'loginError';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <img
              src="/assets/generated/flight-log-logo.dim_256x256.png"
              alt="Flight Log Manager"
              className="w-24 h-24 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight mb-2">
            Flight Log
          </h1>
          <p className="text-muted-foreground text-center text-sm">
            Professional aviation flight management system
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">Welcome Back</h2>
              <p className="text-xs text-muted-foreground">Sign in to access your flight logs</p>
            </div>
          </div>

          {isError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              Login failed. Please try again.
            </div>
          )}

          <Button
            onClick={handleAuth}
            disabled={isLoggingIn}
            className="w-full h-12 font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Secure authentication powered by Internet Identity
          </p>
        </div>

        {/* Features preview */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '✈️', label: 'Flight Logging' },
            { icon: '📊', label: 'Dashboard' },
            { icon: '📋', label: 'Records & Export' },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-lg bg-card/50 border border-border/50">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-xs text-muted-foreground font-medium">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
