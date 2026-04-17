"use client";

import { Toaster as ReactHotToaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ToasterProps {
  className?: string;
}

/**
 * Componente global de toasts.
 * Deve ser renderizado uma vez no AppShell/app root.
 * 
 * Configurações:
 * - Posição: top-right (ideal para dashboards)
 * - Estilo: dark mode com cores do design system
 * - Durações configuradas no notificationService
 */
export function Toaster({ className }: ToasterProps) {
  return (
    <ReactHotToaster
      position="top-right"
      toastOptions={{
        className: cn(
          // Base styles
          'font-sans text-sm font-medium',
          // Dark mode base
          'dark:bg-zinc-900 dark:text-zinc-100',
          // Border e shadow
          'border border-zinc-200 dark:border-zinc-800',
          'shadow-lg',
          // Border radius
          'rounded-2xl',
          // Padding
          'p-4',
          className
        ),
        // Sucesso
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
          style: {
            background: '#052e16',
            color: '#dcfce7',
            borderColor: '#166534',
          },
        },
        // Erro
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          style: {
            background: '#450a0a',
            color: '#fecaca',
            borderColor: '#991b1b',
          },
        },
        // Promise loading
        loading: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#fff',
          },
          style: {
            background: '#1e3a5f',
            color: '#dbeafe',
            borderColor: '#1e40af',
          },
        },
        // Estilo padrão
        style: {
          background: '#18181b',
          color: '#fafafa',
          borderColor: '#27272a',
        },
      }}
    />
  );
}

export default Toaster;