"use client";
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-status-danger-bg border border-destructive/30 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-status-danger-ink" aria-hidden="true" />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            Algo inesperado aconteceu
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
            Ocorreu uma falha ao exibir esta tela. Seus dados na nuvem permanecem preservados. Tente recarregar ou voltar para o login.
          </p>
          {this.state.error && (
            <pre className="mt-4 text-xs font-mono bg-muted p-3 rounded-lg border border-border max-w-lg overflow-auto text-left w-full">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-6 w-full max-w-sm">
            <Button onClick={() => window.location.reload()} className="flex-1">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Recarregar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("cacambago-storage-v2");
                window.location.href = "/login";
              }}
              className="flex-1"
            >
              Ir para login
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
