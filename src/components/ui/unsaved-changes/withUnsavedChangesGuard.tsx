'use client';

import React, { useState, useEffect, useCallback, useMemo, ComponentType } from 'react';
import { ModalBase, ModalBaseProps } from '@/components/ui/modal-base';
import { UnsavedChangesConfirmDialog } from './UnsavedChangesConfirmDialog';

export interface WithUnsavedChangesGuardOptions {
  formData: Record<string, unknown> | (() => Record<string, unknown>);
  initialData: Record<string, unknown> | (() => Record<string, unknown>);
  watchField?: string;
  enableDeepCompare?: boolean;
  message?: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  theme?: 'auto' | 'light' | 'dark';
}

export function withUnsavedChangesGuard<P extends object>(
  WrappedModal: ComponentType<P>,
  options: WithUnsavedChangesGuardOptions
) {
  type Props = P & {
    isOpen: boolean;
    onClose: () => void;
  };

  return function WrappedComponent({
    isOpen,
    onClose,
    ...rest
  }: Props) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const formDataObj = typeof options.formData === 'function' 
      ? (options.formData as () => Record<string, unknown>)() 
      : options.formData;
    const initialDataObj = typeof options.initialData === 'function'
      ? (options.initialData as () => Record<string, unknown>)()
      : options.initialData;

    const hasUnsavedChanges = useMemo(() => {
      if (!formDataObj || !initialDataObj) return false;
      
      if (options.watchField) {
        const currentVal = formDataObj[options.watchField];
        const initialVal = initialDataObj[options.watchField];
        if (options.enableDeepCompare !== false) {
          return JSON.stringify(currentVal) !== JSON.stringify(initialVal);
        }
        return currentVal !== initialVal;
      }

      if (options.enableDeepCompare !== false) {
        return JSON.stringify(formDataObj) !== JSON.stringify(initialDataObj);
      }
      return formDataObj !== initialDataObj;
    }, [formDataObj, initialDataObj, options.watchField, options.enableDeepCompare]);

    const handleClose = useCallback(() => {
      if (hasUnsavedChanges && !isClosing) {
        setShowConfirm(true);
      } else {
        onClose();
      }
    }, [hasUnsavedChanges, isClosing, onClose]);

    const handleConfirm = useCallback(() => {
      setShowConfirm(false);
      setIsClosing(true);
      onClose();
    }, [onClose]);

    const handleCancel = useCallback(() => {
      setShowConfirm(false);
    }, []);

    useEffect(() => {
      if (isOpen) {
        setShowConfirm(false);
        setIsClosing(false);
      }
    }, [isOpen]);

    const modalProps = {
      ...rest,
      isOpen,
      onClose: handleClose,
    } as P;

    return (
      <>
        <WrappedModal {...modalProps} />
        <UnsavedChangesConfirmDialog
          isOpen={showConfirm}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          message={options.message}
          title={options.title}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          theme={options.theme}
        />
      </>
    );
  };
}

export interface UseModalUnsavedGuardOptions {
  formData: Record<string, unknown>;
  initialData: Record<string, unknown>;
  enableDeepCompare?: boolean;
}

export interface UseModalUnsavedGuardReturn {
  hasChanges: boolean;
  handleClose: () => void;
  forceClose: () => void;
  ConfirmDialog: React.ReactNode;
}

export function useModalUnsavedGuard({
  formData,
  initialData,
  enableDeepCompare = true,
}: UseModalUnsavedGuardOptions): UseModalUnsavedGuardReturn {
  const [showConfirm, setShowConfirm] = useState(false);
  const [forceCloseFlag, setForceCloseFlag] = useState(false);

  const hasChanges = useMemo(() => {
    if (!formData || !initialData) return false;
    if (enableDeepCompare) {
      return JSON.stringify(formData) !== JSON.stringify(initialData);
    }
    return formData !== initialData;
  }, [formData, initialData, enableDeepCompare]);

  const handleClose = useCallback(() => {
    if (hasChanges && !forceCloseFlag) {
      setShowConfirm(true);
    }
  }, [hasChanges, forceCloseFlag]);

  const forceClose = useCallback(() => {
    setForceCloseFlag(true);
    setShowConfirm(false);
  }, []);

  const ConfirmDialog = useMemo(() => (
    <UnsavedChangesConfirmDialog
      isOpen={showConfirm}
      onConfirm={forceClose}
      onCancel={() => setShowConfirm(false)}
    />
  ), [showConfirm, forceClose]);

  return {
    hasChanges,
    handleClose,
    forceClose,
    ConfirmDialog,
  };
}

export interface UnsavedChangesFieldConfig {
  get: () => Record<string, unknown>;
  initial: Record<string, unknown>;
}

export interface CreateUnsavedChangesGuardOptions {
  fields: Record<string, UnsavedChangesFieldConfig>;
  message?: string;
  title?: string;
}

export function createUnsavedChangesGuard(
  options: CreateUnsavedChangesGuardOptions
) {
  return function <P extends object>(Component: ComponentType<P>) {
    return function Wrapped(props: P & { isOpen: boolean; onClose: () => void }) {
      const [showConfirm, setShowConfirm] = useState(false);
      const [forceClose, setForceClose] = useState(false);

      const hasAnyChanges = Object.values(options.fields).some(field => {
        const current = field.get();
        const initial = field.initial;
        return JSON.stringify(current) !== JSON.stringify(initial);
      });

      const handleClose = useCallback(() => {
        if (hasAnyChanges && !forceClose) {
          setShowConfirm(true);
        } else {
          props.onClose();
        }
      }, [hasAnyChanges, forceClose, props.onClose]);

      const handleConfirm = useCallback(() => {
        setForceClose(true);
        props.onClose();
      }, [props.onClose]);

      const handleCancel = useCallback(() => setShowConfirm(false), []);

      return (
        <>
          <Component {...props} isOpen={props.isOpen} onClose={handleClose} />
          <UnsavedChangesConfirmDialog
            isOpen={showConfirm}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            message={options.message}
            title={options.title}
          />
        </>
      );
    };
  };
}