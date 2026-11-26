"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAppStore } from "@/store/useAppStore";
import { BackgroundSyncProvider } from "@/shared/providers/BackgroundSyncProvider";
import { Toaster } from "@/components/ui/Toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { firebaseAuth } from "@/infrastructure/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuthActions } from "@/core/application/useAuthActions";
import { isCloudWriteBlocked, resetOperationalStore } from "@/core/application/session-utils";
import { LocacaoModal } from "@/features/rentals/components/LocacaoModal";
import { useRentalsController } from "@/features/rentals/hooks/useRentalsController";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms}ms) em ${label}`)), ms)
    ),
  ]);
}

function QuickRentalHost({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const clientes = useAppStore((s) => s.clientes);
  const cacambas = useAppStore((s) => s.cacambas);
  const perfil = useAppStore((s) => s.perfil);
  const { handleSave, handleAddClienteAndSave } = useRentalsController();

  if (!isOpen) return null;

  return (
    <LocacaoModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      onAddClienteAndSave={handleAddClienteAndSave}
      clientes={clientes}
      cacambas={cacambas}
      perfil={perfil}
    />
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const usuarioAtual = useAppStore((s) => s.usuarioAtual);
  const { carregarDadosDoUsuario } = useAuthActions();

  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [quickRentalOpen, setQuickRentalOpen] = useState(false);

  const isPublicAuthRoute = pathname === "/login" || pathname.startsWith("/auth/callback");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let active = true;

    const loadUserFromSession = async (user: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    }) => {
      const displayName =
        String(
          user.user_metadata?.nome ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Usuário"
        );
      await withTimeout(
        carregarDadosDoUsuario(user.id, user.email || "", displayName),
        12000,
        "carregarDadosDoUsuario"
      );
    };

    const checkSession = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 8000, "getSession");
        if (!active) return;
        const user = data.session?.user;
        const recoveryPending =
          typeof window !== "undefined" &&
          sessionStorage.getItem("cacambago_recovery_pending") === "1";

        if (user && !useAppStore.getState().usuarioAtual && !recoveryPending) {
          try {
            await loadUserFromSession(user);
          } catch (err: any) {
            console.error("[AppShell] falha ao carregar dados:", err);
            const msg = String(err?.message || "");
            if (msg.includes("JWT") || msg.includes("Invalid") || msg.includes("not authenticated")) {
              try {
                await supabase.auth.signOut();
              } catch {
                // ignora
              }
            } else if (active) {
              setAuthError(msg || "Falha ao carregar dados. Verifique sua conexão.");
            }
          }
        }
      } catch (err: any) {
        console.error("[AppShell] getSession falhou:", err);
        if (active) setAuthError(err?.message || "Falha ao verificar sessão.");
      } finally {
        if (active) setAuthChecked(true);
      }
    };

    void checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      const recoveryPending =
        typeof window !== "undefined" &&
        sessionStorage.getItem("cacambago_recovery_pending") === "1";

      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        session?.user &&
        !useAppStore.getState().usuarioAtual &&
        !recoveryPending
      ) {
        try {
          await loadUserFromSession(session.user);
        } catch (e) {
          console.error("[AppShell] onAuthStateChange load failed:", e);
        }
      }

      if (event === "SIGNED_OUT") {
        resetOperationalStore();
      }
    });

    const unsubFb = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (!active) return;
      if (fbUser && !useAppStore.getState().usuarioAtual) {
        const cleanEmail = fbUser.email?.toLowerCase().trim() || "";
        const displayName = fbUser.displayName || cleanEmail.split("@")[0] || "Usuário";
        const CANONICAL_BORGHELIX_ID = "87f05076-b040-4f03-8ea4-e22bee57d4ef";
        const storeUsersData = useAppStore.getState().usersData || {};
        const existingUidByEmail = Object.keys(storeUsersData).find(
          (uid) => storeUsersData[uid]?.perfil?.email?.toLowerCase().trim() === cleanEmail
        );

        const effectiveId =
          cleanEmail === "borghelixcacambas@gmail.com"
            ? CANONICAL_BORGHELIX_ID
            : existingUidByEmail || fbUser.uid;

        try {
          await carregarDadosDoUsuario(effectiveId, cleanEmail, displayName);
        } catch (e) {
          console.error("[AppShell] onAuthStateChanged Firebase load error:", e);
        }
      }
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
      unsubFb();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !authChecked) return;

    if (!usuarioAtual && !isPublicAuthRoute) {
      router.push("/login");
    } else if (usuarioAtual && pathname === "/login") {
      const recoveryPending =
        typeof window !== "undefined" &&
        sessionStorage.getItem("cacambago_recovery_pending") === "1";
      if (!recoveryPending) {
        router.push("/");
      }
    }
  }, [usuarioAtual, pathname, isPublicAuthRoute, router, mounted, authChecked]);

  if (!mounted) {
    return <div className="min-h-[100dvh] bg-background" />;
  }

  if (isPublicAuthRoute) {
    return (
      <ErrorBoundary>
        <BackgroundSyncProvider>
          <main className="min-h-[100dvh] bg-background text-foreground">{children}</main>
        </BackgroundSyncProvider>
        <Toaster />
      </ErrorBoundary>
    );
  }

  if (!authChecked) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground gap-3 p-4">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm font-medium text-muted-foreground">Carregando sessão...</p>
      </div>
    );
  }

  if (authError && !usuarioAtual) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground px-6 text-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-status-warning-bg border border-amber-500/30 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-status-warning-ink" aria-hidden="true" />
        </div>
        <h2 className="font-display text-lg font-bold">Falha de conexão</h2>
        <p className="text-sm text-muted-foreground max-w-md">{authError}</p>
        <div className="flex gap-2.5">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
          <Button variant="outline" onClick={() => router.push("/login")}>
            Ir para login
          </Button>
        </div>
      </div>
    );
  }

  if (!usuarioAtual) {
    return <div className="min-h-[100dvh] bg-background" />;
  }

  const syncPaused = isCloudWriteBlocked(usuarioAtual.id);

  return (
    <ErrorBoundary>
      <BackgroundSyncProvider>
        <div className="min-h-[100dvh] bg-background text-foreground flex">
          <Sidebar />

          <div className="flex-1 min-w-0 flex flex-col">
            <Header onOpenQuickRental={() => setQuickRentalOpen(true)} />

            {syncPaused && (
              <div
                role="status"
                className="bg-status-warning-bg text-status-warning-ink border-b border-amber-500/30 px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 text-center"
              >
                <CloudOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Falha ao ler perfil na nuvem no login. Exibindo cache local com envio remoto pausado para proteger seus dados.
                </span>
              </div>
            )}

            <main className="flex-1 min-w-0 w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-10">
              {children}
            </main>
          </div>
        </div>

        <MobileBottomNav onOpenQuickRental={() => setQuickRentalOpen(true)} />
        <QuickRentalHost isOpen={quickRentalOpen} onClose={() => setQuickRentalOpen(false)} />
      </BackgroundSyncProvider>
      <Toaster />
    </ErrorBoundary>
  );
}
