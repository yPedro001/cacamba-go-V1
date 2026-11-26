"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuthActions } from "@/core/application/useAuthActions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Loader2,
  KeyRound,
  Mail,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  FileText,
  Truck,
} from "lucide-react";

type AuthView =
  | "LOGIN"
  | "CADASTRO"
  | "CONFIRMAR_CONTA"
  | "ESQUECI_SENHA_EMAIL"
  | "ESQUECI_SENHA_CODIGO"
  | "NOVA_SENHA";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const {
    login,
    loginWithGoogle,
    register,
    verifyOtp,
    sendPasswordReset,
    resetPassword,
    resendOtp,
  } = useAuthActions();

  const [view, setView] = useState<AuthView>("LOGIN");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const changeView = (newView: AuthView, keepFeedback = false) => {
    setView(newView);
    if (!keepFeedback) {
      setError("");
      setSuccess("");
    } else {
      setError("");
    }
    setOtp("");
  };

  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setIsGoogleLoading(true);
    const res = await loginWithGoogle();
    if (!res.success) {
      setError(res.error || "Falha ao conectar com Google.");
      setIsGoogleLoading(false);
    }
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim() || !senha) {
      setError("Preencha e-mail e senha para entrar.");
      return;
    }
    setIsLoading(true);
    const res = await login(email, senha);
    if (!res.success) {
      setError(res.error || "E-mail ou senha incorretos.");
      setIsLoading(false);
    }
  };

  const submitCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nome.trim() || !email.trim() || !senha) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    const res = await register(nome, email, senha);
    setIsLoading(false);

    if (res.success) {
      setSuccess("Conta criada! Digite o código de 8 dígitos enviado para o seu e-mail.");
      changeView("CONFIRMAR_CONTA", true);
      startCooldown();
    } else {
      setError(res.error || "Erro ao cadastrar usuário.");
    }
  };

  const submitConfirmarConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length < 8) {
      setError("Digite o código completo de 8 dígitos.");
      return;
    }

    setIsLoading(true);
    const res = await verifyOtp(email, otp, "signup");
    if (!res.success) {
      setError(res.error || "Código inválido ou expirado.");
      setIsLoading(false);
    }
  };

  const submitEsqueciSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Informe seu e-mail de cadastro.");
      return;
    }

    setIsLoading(true);
    const res = await sendPasswordReset(email);
    setIsLoading(false);

    if (res.success) {
      setSuccess("Enviamos um código de 8 dígitos para o seu e-mail.");
      changeView("ESQUECI_SENHA_CODIGO", true);
      startCooldown();
    } else {
      setError(res.error || "Não foi possível enviar o código de recuperação.");
    }
  };

  const submitVerificarCodigoRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length < 8) {
      setError("Digite o código completo de 8 dígitos.");
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("cacambago_recovery_pending", "1");
    }

    setIsLoading(true);
    const res = await verifyOtp(email, otp, "recovery");
    setIsLoading(false);

    if (res.success) {
      setSuccess("Código confirmado. Defina sua nova senha abaixo.");
      changeView("NOVA_SENHA", true);
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cacambago_recovery_pending");
      }
      setError(res.error || "Código inválido ou expirado.");
    }
  };

  const submitNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (senha.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setError("As senhas não conferem.");
      return;
    }

    setIsLoading(true);
    const res = await resetPassword(senha);
    setIsLoading(false);

    if (res.success) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cacambago_recovery_pending");
      }
      setSenha("");
      setConfirmarSenha("");
      setSuccess("Senha atualizada! Entre com sua nova senha.");
      changeView("LOGIN", true);
    } else {
      setError(res.error || "Erro ao atualizar senha.");
    }
  };

  const handleResend = async (type: "signup" | "recovery") => {
    if (resendCooldown > 0) return;
    setError("");
    setSuccess("");
    setIsLoading(true);
    const res = await resendOtp(email, type);
    setIsLoading(false);

    if (res.success) {
      setSuccess("Novo código reenviado. Verifique sua caixa de entrada e o spam.");
      startCooldown();
    } else {
      setError(res.error || "Erro ao reenviar código.");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground grid lg:grid-cols-12">
      {/* Coluna institucional desktop — Lyvox Dark Premium */}
      <div className="hidden lg:flex lg:col-span-5 bg-card text-card-foreground p-10 flex-col justify-between border-r border-border">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="CaçambaGo" className="h-10 w-10" />
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Caçamba<span className="text-primary">Go</span>
            </span>
            <span className="block text-xs text-muted-foreground">Gestão Operacional de Caçambas</span>
          </div>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="font-display text-3xl font-bold tracking-tight leading-tight text-foreground">
            Controle de pátio, mapa, financeiro e CTR em um só lugar.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Feito para a rotina real de pequenas locadoras de caçambas — no escritório ou direto do celular na obra.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center text-primary shrink-0">
                <Truck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Agenda &amp; Estoque Sincronizados</p>
                <p className="text-xs text-muted-foreground">Entregas, prazos vencidos e caçambas disponíveis no pátio.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center text-primary shrink-0">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Mapa Operacional &amp; Rotas</p>
                <p className="text-xs text-muted-foreground">Localize cada caçamba e abra a rota em segundos no celular.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center text-primary shrink-0">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">CTR &amp; Recibo com PIX</p>
                <p className="text-xs text-muted-foreground">Emissão em PDF/Word e comprovantes prontos para WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Dados protegidos com sessão autenticada e histórico na nuvem.
        </p>
      </div>

      {/* Coluna do formulário */}
      <div className="lg:col-span-7 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[440px] space-y-6">
          {/* Header mobile da marca */}
          <div className="flex lg:hidden items-center justify-center gap-2.5">
            <img src="/favicon.svg" alt="CaçambaGo" className="h-9 w-9" />
            <span className="font-display text-2xl font-bold tracking-tight">
              Caçamba<span className="text-primary">Go</span>
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-5 sm:p-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-status-danger-bg px-3.5 py-3 text-xs sm:text-sm font-medium text-status-danger-ink"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-status-success-bg px-3.5 py-3 text-xs sm:text-sm font-medium text-status-success-ink"
              >
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{success}</span>
              </div>
            )}

            {view === "LOGIN" && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                    Entrar na sua operação
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Use sua conta Google ou e-mail e senha cadastrados.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Continuar com Google</span>
                </Button>

                <div className="relative flex items-center py-0.5">
                  <div className="flex-grow border-t border-border" />
                  <span className="mx-3 text-xs font-medium text-muted-foreground">
                    ou com e-mail
                  </span>
                  <div className="flex-grow border-t border-border" />
                </div>

                <form onSubmit={submitLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-email" className="text-xs font-semibold text-foreground">
                        E-mail
                      </label>
                      <button
                        type="button"
                        onClick={() => setEmail("borghelixcacambas@gmail.com")}
                        className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded px-1"
                      >
                        Usar borghelixcacambas@gmail.com
                      </button>
                    </div>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@suaempresa.com.br"
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="login-password" className="text-xs font-semibold text-foreground">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => changeView("ESQUECI_SENHA_EMAIL")}
                        className="text-xs font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded px-1"
                      >
                        Esqueci a senha
                      </button>
                    </div>
                    <PasswordInput
                      id="login-password"
                      autoComplete="current-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>

                  <Button type="submit" disabled={isLoading || isGoogleLoading} className="w-full">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground pt-1">
                  Ainda não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => changeView("CADASTRO")}
                    className="font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded px-1"
                  >
                    Criar conta grátis
                  </button>
                </p>
              </div>
            )}

            {view === "CADASTRO" && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                    Criar conta
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Configure seu acesso para começar a controlar sua frota.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading}
                  className="w-full"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Cadastrar com Google</span>
                </Button>

                <div className="relative flex items-center py-0.5">
                  <div className="flex-grow border-t border-border" />
                  <span className="mx-3 text-xs font-medium text-muted-foreground">
                    ou preencha abaixo
                  </span>
                  <div className="flex-grow border-t border-border" />
                </div>

                <form onSubmit={submitCadastro} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="cad-nome" className="text-xs font-semibold text-foreground">
                      Seu nome ou empresa
                    </label>
                    <Input
                      id="cad-nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Silva Caçambas"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cad-email" className="text-xs font-semibold text-foreground">
                      E-mail
                    </label>
                    <Input
                      id="cad-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@suaempresa.com.br"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cad-senha" className="text-xs font-semibold text-foreground">
                      Senha (mínimo 6 caracteres)
                    </label>
                    <PasswordInput
                      id="cad-senha"
                      autoComplete="new-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Crie uma senha forte"
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      "Criar conta e enviar código"
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Já possui conta?{" "}
                  <button
                    type="button"
                    onClick={() => changeView("LOGIN")}
                    className="font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded px-1"
                  >
                    Entrar
                  </button>
                </p>
              </div>
            )}

            {view === "CONFIRMAR_CONTA" && (
              <form onSubmit={submitConfirmarConta} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <Mail className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-xl font-bold">Confirme seu e-mail</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Enviamos um código de <strong>8 dígitos</strong> para{" "}
                    <span className="font-semibold text-foreground break-all">{email}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <OtpInput value={otp} onChange={setOtp} length={8} disabled={isLoading} />
                </div>

                <Button type="submit" disabled={isLoading || otp.length < 8} className="w-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar e acessar"}
                </Button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => changeView("CADASTRO")}
                    className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground min-h-[36px]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={() => handleResend("signup")}
                    className="font-semibold text-primary disabled:text-muted-foreground hover:underline min-h-[36px]"
                  >
                    {resendCooldown > 0
                      ? `Reenviar em ${resendCooldown}s`
                      : "Reenviar código"}
                  </button>
                </div>
              </form>
            )}

            {view === "ESQUECI_SENHA_EMAIL" && (
              <form onSubmit={submitEsqueciSenha} className="space-y-5">
                <div className="space-y-1">
                  <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-2">
                    <KeyRound className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-xl font-bold">Recuperar senha</h2>
                  <p className="text-sm text-muted-foreground">
                    Informe seu e-mail para receber o código de redefinição.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="rec-email" className="text-xs font-semibold text-foreground">
                    E-mail cadastrado
                  </label>
                  <Input
                    id="rec-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@suaempresa.com.br"
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enviar código de recuperação"
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => changeView("LOGIN")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground min-h-[36px]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Voltar para o login
                  </button>
                </div>
              </form>
            )}

            {view === "ESQUECI_SENHA_CODIGO" && (
              <form onSubmit={submitVerificarCodigoRecuperacao} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-xl font-bold">Código de recuperação</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Informe o código de <strong>8 dígitos</strong> enviado para{" "}
                    <span className="font-semibold text-foreground break-all">{email}</span>
                  </p>
                </div>

                <OtpInput value={otp} onChange={setOtp} length={8} disabled={isLoading} />

                <Button type="submit" disabled={isLoading || otp.length < 8} className="w-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar código"}
                </Button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => changeView("ESQUECI_SENHA_EMAIL")}
                    className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground min-h-[36px]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Alterar e-mail
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={() => handleResend("recovery")}
                    className="font-semibold text-primary disabled:text-muted-foreground hover:underline min-h-[36px]"
                  >
                    {resendCooldown > 0
                      ? `Reenviar em ${resendCooldown}s`
                      : "Reenviar código"}
                  </button>
                </div>
              </form>
            )}

            {view === "NOVA_SENHA" && (
              <form onSubmit={submitNovaSenha} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="font-display text-xl font-bold">Definir nova senha</h2>
                  <p className="text-sm text-muted-foreground">
                    Escolha uma senha segura com no mínimo 6 caracteres.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-pass" className="text-xs font-semibold text-foreground">
                    Nova senha
                  </label>
                  <PasswordInput
                    id="new-pass"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-pass" className="text-xs font-semibold text-foreground">
                    Confirmar nova senha
                  </label>
                  <PasswordInput
                    id="confirm-pass"
                    autoComplete="new-password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar nova senha"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
