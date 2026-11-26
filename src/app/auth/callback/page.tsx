'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notificationService';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function completeOAuth() {
      if (!isSupabaseConfigured) {
        if (!active) return;
        setStatus('error');
        setErrorMessage('Configuração do Supabase não encontrada neste ambiente.');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const oauthError =
        params.get('error_description') ||
        params.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (oauthError) {
        if (!active) return;
        setStatus('error');
        setErrorMessage(decodeURIComponent(oauthError));
        return;
      }

      const code = params.get('code');
      const mode = params.get('mode') || 'login';

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        if (!data.session) {
          // Pequeno aguardo caso detectSessionInUrl esteja finalizando troca de hash implícito
          await new Promise((r) => setTimeout(r, 400));
          const retry = await supabase.auth.getSession();
          if (!retry.data.session) {
            throw new Error('Não foi possível confirmar a sessão Google. Tente entrar novamente.');
          }
        }

        if (!active) return;
        setStatus('success');
        if (mode === 'link') {
          notify.success('Conta Google vinculada com sucesso.');
          router.replace('/perfil');
        } else {
          router.replace('/');
        }
      } catch (err: any) {
        if (!active) return;
        setStatus('error');
        setErrorMessage(err?.message || 'Falha ao concluir autenticação com Google.');
      }
    }

    completeOAuth();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm text-center space-y-5">
        {status === 'loading' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-xl font-bold text-foreground">Validando acesso Google</h1>
              <p className="text-sm text-muted-foreground">
                Conectando sua conta com segurança ao CaçambaGo...
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-xl font-bold text-foreground">Autenticado!</h1>
              <p className="text-sm text-muted-foreground">Redirecionando para o painel operacional...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-xl font-bold text-foreground">Não foi possível entrar com Google</h1>
              <p className="text-sm text-muted-foreground break-words">{errorMessage}</p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild className="min-h-[44px] w-full sm:w-auto">
                <Link href="/login">Voltar para o login</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
