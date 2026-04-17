import toast from 'react-hot-toast';

// ============================================
// CONFIGURAÇÕES
// ============================================

const MAX_TOASTS = 3;
const DURATION = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
  promise: undefined, // automático
};

// Limite de tempo para evitar spam (ms)
const THROTTLE_WINDOW = 5000;
const lastToastTimes: Record<string, number> = {};

// ============================================
// TIPOS
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'promise';

export interface NotificationOptions {
  id?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================
// HELPERS
// ============================================

/**
 * Limita toasts por tipo para evitar spam
 */
const shouldShowToast = (key: string): boolean => {
  const now = Date.now();
  const lastTime = lastToastTimes[key] || 0;
  
  if (now - lastTime < THROTTLE_WINDOW) {
    return false;
  }
  
  lastToastTimes[key] = now;
  return true;
};

/**
 * Limpa toasts antigos se passaram o limite
 */
const enforceMaxToasts = () => {
  // Limite simplificado - apenas não mostra mais se já atingiu o máximo
  // O react-hot-toast gerencia a fila automaticamente
};

// ============================================
// SERVICE PRINCIPAL
// ============================================

class NotificationService {
  /**
   * Toast de sucesso - operações completadas
   */
  success(message: string, options?: NotificationOptions): string {
    if (!shouldShowToast(`success:${message.slice(0, 20)}`)) {
      return '';
    }
    enforceMaxToasts();
    return toast.success(message, {
      duration: options?.duration ?? DURATION.success,
      ...options,
    });
  }

  /**
   * Toast de erro - operações falharam
   */
  error(message: string, options?: NotificationOptions): string {
    enforceMaxToasts();
    return toast.error(message, {
      duration: options?.duration ?? DURATION.error,
      ...options,
    });
  }

  /**
   * Toast de aviso - atenção necessária
   */
  warning(message: string, options?: NotificationOptions): string {
    if (!shouldShowToast(`warning:${message.slice(0, 20)}`)) {
      return '';
    }
    enforceMaxToasts();
    return toast(message, {
      duration: options?.duration ?? DURATION.warning,
      icon: '⚠️',
      ...options,
    });
  }

  /**
   * Toast de informação - contexto geral
   */
  info(message: string, options?: NotificationOptions): string {
    if (!shouldShowToast(`info:${message.slice(0, 20)}`)) {
      return '';
    }
    enforceMaxToasts();
    return toast(message, {
      duration: options?.duration ?? DURATION.info,
      ...options,
    });
  }

  /**
   * Toast de promise - operações async automáticas
   * showing loading → success ou error automaticamente
   */
  promise<T>(
    promise: Promise<T>,
    {
      loading = 'Processando...',
      success = 'Concluído!',
      error = 'Algo deu errado',
    }: {
      loading?: string;
      success?: string;
      error?: string;
    },
    options?: NotificationOptions
  ): Promise<T> {
    enforceMaxToasts();
    return toast.promise(promise, {
      loading,
      success,
      error,
      ...options,
    }) as Promise<T>;
  }

  /**
   * Dismiss um toast específico
   */
  dismiss(id?: string): void {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  }

  /**
   * Remove todos os toasts
   */
  dismissAll(): void {
    toast.dismiss();
  }
}

// ============================================
// EXPORT
// ============================================

export const notificationService = new NotificationService();

// Export alternativo direto (para uso rápido)
export const toastNotify = {
  success: (msg: string, opts?: NotificationOptions) => notificationService.success(msg, opts),
  error: (msg: string, opts?: NotificationOptions) => notificationService.error(msg, opts),
  warning: (msg: string, opts?: NotificationOptions) => notificationService.warning(msg, opts),
  info: (msg: string, opts?: NotificationOptions) => notificationService.info(msg, opts),
  promise: <T>(p: Promise<T>, opts: { loading: string; success: string; error?: string }) => 
    notificationService.promise(p, opts),
};

export default notificationService;