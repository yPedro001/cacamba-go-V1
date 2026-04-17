import { useState, useEffect, useCallback, useRef } from 'react';

export type FormData = Record<string, unknown>;

export interface UseModalUnsavedChangesOptions<T extends FormData> {
  initialData: T;
  enableDeepCompare?: boolean;
  onConfirmClose?: () => Promise<boolean> | boolean;
}

export interface UseModalUnsavedChangesReturn<T extends FormData> {
  hasUnsavedChanges: boolean;
  confirmClose: () => Promise<boolean>;
  markAsSaved: (newData?: T) => void;
  markAsDirty: () => void;
  resetToSaved: () => void;
  originalData: T;
  currentData: T;
  setCurrentData: React.Dispatch<React.SetStateAction<T>>;
}

export function useModalUnsavedChanges<T extends FormData>({
  initialData,
  enableDeepCompare = true,
  onConfirmClose,
}: UseModalUnsavedChangesOptions<T>): UseModalUnsavedChangesReturn<T> {
  const [originalData, setOriginalData] = useState<T>(initialData);
  const [currentData, setCurrentData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (isMountedRef.current) {
      setOriginalData(initialData);
      setCurrentData(initialData);
      setIsDirty(false);
    } else {
      isMountedRef.current = true;
    }
  }, [initialData]);

  const deepEqual = useCallback((a: unknown, b: unknown): boolean => {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (typeof a !== 'object' || typeof b !== 'object') return a === b;

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!bKeys.includes(key)) return false;
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }

    return true;
  }, []);

  const hasUnsavedChanges = isDirty || (
    enableDeepCompare 
      ? !deepEqual(originalData, currentData)
      : JSON.stringify(originalData) !== JSON.stringify(currentData)
  );

  const confirmClose = useCallback(async (): Promise<boolean> => {
    if (!hasUnsavedChanges) {
      return true;
    }

    if (onConfirmClose) {
      return await onConfirmClose();
    }

    return true;
  }, [hasUnsavedChanges, onConfirmClose]);

  const markAsSaved = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setOriginalData(newData);
      setCurrentData(newData);
    } else {
      setOriginalData(currentData);
    }
    setIsDirty(false);
  }, [currentData]);

  const markAsDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const resetToSaved = useCallback(() => {
    setCurrentData(originalData);
    setIsDirty(false);
  }, [originalData]);

  return {
    hasUnsavedChanges,
    confirmClose,
    markAsSaved,
    markAsDirty,
    resetToSaved,
    originalData,
    currentData,
    setCurrentData,
  };
}