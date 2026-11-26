"use client";

import React, { useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  theme?: "auto" | "light" | "dark";
}

export function UnsavedChangesConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  onOpenChange,
  message = "Tem certeza que deseja fechar? As alterações não salvas serão perdidas.",
  title = "Alterações Não Salvas",
  confirmText = "Descartar e fechar",
  cancelText = "Continuar editando",
  className,
  theme = "auto",
}: UnsavedChangesConfirmDialogProps) {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && onCancel) {
        onCancel();
      }
      onOpenChange?.(open);
    },
    [onCancel, onOpenChange]
  );

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const surfaceClass =
    theme === "dark"
      ? "bg-[#24211D] text-[#F1EEE7] border-[#45403A]"
      : theme === "light"
        ? "bg-[#FCFBF8] text-[#231E1A] border-[#D0CBC0]"
        : "bg-card text-card-foreground border-border";

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[450] bg-stone-950/65 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <Dialog.Content
            className={cn(
              "relative w-full sm:max-w-md rounded-t-[20px] sm:rounded-2xl border p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl focus:outline-none",
              surfaceClass,
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
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-status-danger-bg border border-destructive/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-status-danger-ink" aria-hidden="true" />
              </div>
            </div>

            <Dialog.Title className="font-display text-center text-lg font-bold tracking-tight mb-2">
              {title}
            </Dialog.Title>

            <Dialog.Description className="text-center text-sm text-muted-foreground mb-6 leading-relaxed">
              {message}
            </Dialog.Description>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                {cancelText}
              </Button>
              <Button type="button" variant="destructive" onClick={handleConfirm} className="flex-1">
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

  const ConfirmDialog = React.useMemo(
    () => (
      <UnsavedChangesConfirmDialog
        isOpen={showConfirm}
        onConfirm={forceClose}
        onCancel={() => setShowConfirm(false)}
      />
    ),
    [showConfirm, forceClose]
  );

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
