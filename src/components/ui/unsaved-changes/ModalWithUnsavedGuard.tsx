'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ModalBase, ModalBaseProps } from '@/components/ui/modal-base';
import { UnsavedChangesConfirmDialog } from './UnsavedChangesConfirmDialog';

export interface ModalWithUnsavedGuardProps<T> {
  isOpen: boolean;
  onClose: () => void;
  formData: T;
  initialData: T;
  children: ModalBaseProps['children'];
  footer?: ModalBaseProps['footer'];
  title?: ModalBaseProps['title'];
  subtitle?: ModalBaseProps['subtitle'];
  maxWidth?: ModalBaseProps['maxWidth'];
  className?: string;
  hideCloseButton?: boolean;
  theme?: ModalBaseProps['theme'];
  enableDeepCompare?: boolean;
  unsavedMessage?: string;
  unsavedTitle?: string;
  confirmCloseText?: string;
  cancelCloseText?: string;
}

export function ModalWithUnsavedGuard<T>({
  isOpen,
  onClose,
  formData,
  initialData,
  children,
  footer,
  title,
  subtitle,
  maxWidth = '2xl',
  className,
  hideCloseButton = false,
  theme = 'auto',
  enableDeepCompare = true,
  unsavedMessage = 'Tem certeza que deseja fechar? Seu progresso até aqui será perdido.',
  unsavedTitle = 'Alterações Não Salvas',
  confirmCloseText = 'Sim, fechar',
  cancelCloseText = 'Não, continuar preenchendo',
}: ModalWithUnsavedGuardProps<T>) {
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [isInternalClose, setIsInternalClose] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    if (!formData || !initialData) return false;
    if (enableDeepCompare) {
      return JSON.stringify(formData) !== JSON.stringify(initialData);
    }
    return formData !== initialData;
  }, [formData, initialData, enableDeepCompare]);

  const handleInternalClose = useCallback(() => {
    if (hasUnsavedChanges && !isInternalClose) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, isInternalClose, onClose]);

  const handleConfirmClose = useCallback(() => {
    setShowUnsavedConfirm(false);
    setIsInternalClose(true);
    onClose();
  }, [onClose]);

  const handleCancelClose = useCallback(() => {
    setShowUnsavedConfirm(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowUnsavedConfirm(false);
      setIsInternalClose(false);
    }
  }, [isOpen]);

  return (
    <>
      <ModalBase
        isOpen={isOpen}
        onClose={handleInternalClose}
        title={title}
        subtitle={subtitle}
        maxWidth={maxWidth}
        className={className}
        hideCloseButton={hideCloseButton}
        theme={theme}
        footer={footer}
      >
        {children}
      </ModalBase>

      <UnsavedChangesConfirmDialog
        isOpen={showUnsavedConfirm}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        message={unsavedMessage}
        title={unsavedTitle}
        confirmText={confirmCloseText}
        cancelText={cancelCloseText}
        theme={theme}
      />
    </>
  );
}