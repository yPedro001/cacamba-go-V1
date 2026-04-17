// Módulo de proteção contra alterações não salvas em modais
// Exporta soluções completas para proteger modais de fechamento acidental

export { 
  useModalUnsavedChanges,
  type UseModalUnsavedChangesOptions,
  type UseModalUnsavedChangesReturn,
  type FormData,
} from './useModalUnsavedChanges';

export {
  UnsavedChangesConfirmDialog,
  useUnsavedChangesGuard,
  type UnsavedChangesConfirmDialogProps,
  type UnsavedChangesGuardOptions,
  type UnsavedChangesGuardReturn,
} from './UnsavedChangesConfirmDialog';

export {
  ModalWithUnsavedGuard,
  type ModalWithUnsavedGuardProps,
} from './ModalWithUnsavedGuard';

export {
  withUnsavedChangesGuard,
  useModalUnsavedGuard,
  createUnsavedChangesGuard,
  type WithUnsavedChangesGuardOptions,
  type UseModalUnsavedGuardOptions,
  type UseModalUnsavedGuardReturn,
  type UnsavedChangesFieldConfig,
  type CreateUnsavedChangesGuardOptions,
} from './withUnsavedChangesGuard';

// Type re-export for common use cases
export type { UnsavedChangesConfirmDialogProps as UnsavedChangesDialogProps } from './UnsavedChangesConfirmDialog';