import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountConfig } from "@/config/account.config";
import {
  getAuthEmailRedirectUrl,
  shouldBlockLocalRemoteSignup,
} from "@/config/auth-runtime.config";
import { brandConfig } from "@/config/brand.config";
import { supabase } from "@/integrations/supabase/client";
import { getPostAuthRedirect } from "@/services/auth-redirect.service";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: `${accountConfig.auth.pageTitle} - ${brandConfig.name}` }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmationEmail, setAwaitingConfirmationEmail] = useState<string | null>(null);
  const signupBlockedByEnvironment = shouldBlockLocalRemoteSignup();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user.id;
      if (!userId) return;
      navigate({ to: await getPostAuthRedirect(userId) });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAwaitingConfirmationEmail(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;

        toast.success(accountConfig.auth.toasts.signinSuccess);
        const redirectTo = data.user
          ? await getPostAuthRedirect(data.user.id)
          : accountConfig.routes.account;
        navigate({ to: redirectTo });
        return;
      }

      if (signupBlockedByEnvironment) {
        throw new Error(accountConfig.auth.environmentSafety.localRemoteSignupBlocked);
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: getAuthEmailRedirectUrl() },
      });
      if (error) throw error;

      if (data.session?.user) {
        toast.success(accountConfig.auth.toasts.signinSuccess);
        navigate({ to: await getPostAuthRedirect(data.session.user.id) });
        return;
      }

      setAwaitingConfirmationEmail(normalizedEmail);
      toast.success(accountConfig.auth.toasts.signupSuccess, {
        description: accountConfig.auth.toasts.signupConfirmation,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : accountConfig.auth.toasts.fallbackError;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="card-surface w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-foreground">{accountConfig.auth.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{accountConfig.auth.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">{accountConfig.auth.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">{accountConfig.auth.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="btn-hero w-full">
            {loading
              ? accountConfig.auth.submitLabels.loading
              : mode === "signin"
                ? accountConfig.auth.submitLabels.signin
                : accountConfig.auth.submitLabels.signup}
          </Button>
        </form>

        {mode === "signup" && signupBlockedByEnvironment ? (
          <div className="mt-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm text-muted-foreground">
            {accountConfig.auth.environmentSafety.localRemoteSignupNotice}
          </div>
        ) : null}

        {awaitingConfirmationEmail ? (
          <div className="mt-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm text-muted-foreground">
            {accountConfig.auth.toasts.signupConfirmation}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin"
            ? accountConfig.auth.toggleLabels.signin
            : accountConfig.auth.toggleLabels.signup}
        </button>
      </div>
    </Container>
  );
}
