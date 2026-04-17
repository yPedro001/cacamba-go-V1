'use client';

import React, { useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UnsavedChangesConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange?: (open: boolean) => void;
  message?: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  autoCloseOnConfirm?: boolean;
  className?: string;
  theme?: 'auto' | 'light' | 'dark';
}

export function UnsavedChangesConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  onOpenChange,
  message = 'Tem certeza que deseja fechar? Seu progresso até aqui será perdido.',
  title = 'Alterações Não Salvas',
  confirmText = 'Sim, fechar',
  cancelText = 'Não, continuar preenchendo',
  autoCloseOnConfirm = true,
  className,
  theme = 'auto',
}: UnsavedChangesConfirmDialogProps) {
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && onCancel) {
      onCancel();
    }
    onOpenChange?.(open);
  }, [onCancel, onOpenChange]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [autoCloseOnConfirm, onConfirm]);

  const contentClass = theme === 'dark'
    ? 'bg-slate-900 text-slate-50'
    : theme === 'light'
    ? 'bg-white text-slate-900'
    : 'bg-card text-card-foreground';

  const overlayClass = theme === 'dark'
    ? 'bg-slate-950/80'
    : theme === 'light'
    ? 'bg-black/50'
    : 'bg-black/60';

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className={cn(
            "fixed inset-0 z-[10099] backdrop-blur-sm flex items-center justify-center p-4",
            overlayClass
          )}
        >
          <Dialog.Content
            className={cn(
              "relative w-full max-w-md p-6 sm:p-8 rounded-[28px] border shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] z-[10100]",
              "animate-in zoom-in-95 duration-200",
              "focus:outline-none",
              contentClass,
              className
            )}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              onCancel();
            }}
            onPointerDownOutside={(e) => {
              e.preventDefault();
            }}
          >
            <div className="flex justify-center mb-6">
              <div className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center",
                theme === 'dark'
                  ? 'bg-red-500/20'
                  : theme === 'light'
                  ? 'bg-red-100'
                  : 'bg-red-500/20'
              )}>
                <AlertTriangle 
                  className={cn(
                    "h-8 w-8",
                    theme === 'dark'
                      ? 'text-red-400'
                      : theme === 'light'
                      ? 'text-red-600'
                      : 'text-red-400'
                  )} 
                />
              </div>
            </div>

            <Dialog.Title className={cn(
              "text-center text-xl font-black uppercase tracking-tight mb-3",
              theme === 'dark' ? 'text-slate-50' : 'text-foreground'
            )}>
              {title}
            </Dialog.Title>

            <Dialog.Description className={cn(
              "text-center text-sm sm:text-base font-medium mb-8",
              theme === 'dark' ? 'text-slate-400' : 'text-muted-foreground'
            )}>
              {message}
            </Dialog.Description>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className={cn(
                  "flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest",
                  "border-2 transition-all active:scale-95",
                  theme === 'dark'
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : theme === 'light'
                    ? 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    : 'border-border hover:bg-accent/10 text-muted-foreground hover:text-foreground'
                )}
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                className={cn(
                  "flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest",
                  "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
                  "transition-all active:scale-95"
                )}
              >
                {confirmText}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export interface UnsavedChangesGuardOptions {
  isModalOpen: boolean;
  onClose: () => void;
  formData: Record<string, unknown>;
  initialData: Record<string, unknown>;
  enableDeepCompare?: boolean;
}

export interface UnsavedChangesGuardReturn {
  hasUnsavedChanges: boolean;
  handleClose: () => void;
  forceClose: () => void;
  ConfirmDialog: React.ReactNode;
}

export function useUnsavedChangesGuard({
  isModalOpen,
  onClose,
  formData,
  initialData,
  enableDeepCompare = true,
}: UnsavedChangesGuardOptions): UnsavedChangesGuardReturn {
  const [showConfirm, setShowConfirm] = React.useState(false);

  const hasUnsavedChanges = React.useMemo(() => {
    if (enableDeepCompare) {
      return JSON.stringify(formData) !== JSON.stringify(initialData);
    }
    return formData !== initialData;
  }, [formData, initialData, enableDeepCompare]);

  const handleClose = React.useCallback(() => {
    if (hasUnsavedChanges) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const forceClose = React.useCallback(() => {
    setShowConfirm(false);
    onClose();
  }, [onClose]);

  const ConfirmDialog = React.useMemo(() => (
    <UnsavedChangesConfirmDialog
      isOpen={showConfirm}
      onConfirm={forceClose}
      onCancel={() => setShowConfirm(false)}
    />
  ), [showConfirm, forceClose]);

  React.useEffect(() => {
    if (isModalOpen) {
      setShowConfirm(false);
    }
  }, [isModalOpen]);

  return {
    hasUnsavedChanges,
    handleClose,
    forceClose,
    ConfirmDialog,
  };
}