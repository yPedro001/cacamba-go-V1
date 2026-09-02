"use client"
import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-6 py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-black tracking-tight">Ops — algo quebrou</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Ocorreu um erro inesperado. Tente recarregar a página. Se o problema persistir, limpe o cache do navegador ou entre em contato com o suporte.
          </p>
          {this.state.error && (
            <pre className="mt-4 text-xs bg-muted p-3 rounded-lg max-w-lg overflow-auto text-left w-full">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90"
            >
              <RefreshCw size={16} /> Recarregar
            </button>
            <button
              onClick={() => { localStorage.removeItem('cacambago-storage-v2'); window.location.href = '/login' }}
              className="px-6 py-3 rounded-xl border border-border font-bold text-sm"
            >
              Limpar cache e ir para login
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
