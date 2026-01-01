import { useState, useCallback, useRef, useEffect } from "react";

interface DirtyTrackerOptions<T extends Record<string, unknown>> {
  initialData?: T;
}

export function useDirtyTracker<T extends Record<string, unknown>>(
  options: DirtyTrackerOptions<T> = {}
) {
  const { initialData } = options;
  const [isDirty, setIsDirty] = useState(false);
  const baselineRef = useRef<T | undefined>(initialData);
  const currentDataRef = useRef<T | undefined>(initialData);

  const setBaseline = useCallback((data: T) => {
    baselineRef.current = { ...data };
    currentDataRef.current = { ...data };
    setIsDirty(false);
  }, []);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    if (!currentDataRef.current) {
      currentDataRef.current = {} as T;
    }
    currentDataRef.current = { ...currentDataRef.current, [field]: value };
    
    if (!baselineRef.current) {
      setIsDirty(true);
      return;
    }

    const hasChanges = Object.keys(currentDataRef.current).some(key => {
      const currentVal = currentDataRef.current?.[key];
      const baseVal = baselineRef.current?.[key];
      return JSON.stringify(currentVal) !== JSON.stringify(baseVal);
    });
    
    setIsDirty(hasChanges);
  }, []);

  const markClean = useCallback(() => {
    if (currentDataRef.current) {
      baselineRef.current = { ...currentDataRef.current };
    }
    setIsDirty(false);
  }, []);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    baselineRef.current = undefined;
    currentDataRef.current = undefined;
    setIsDirty(false);
  }, []);

  return {
    isDirty,
    setBaseline,
    updateField,
    markClean,
    markDirty,
    reset,
  };
}

export function useSimpleDirtyTracker() {
  const [isDirty, setIsDirty] = useState(false);
  const hasInteractedRef = useRef(false);

  const markDirty = useCallback(() => {
    hasInteractedRef.current = true;
    setIsDirty(true);
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  const reset = useCallback(() => {
    hasInteractedRef.current = false;
    setIsDirty(false);
  }, []);

  return {
    isDirty,
    markDirty,
    markClean,
    reset,
    hasInteracted: () => hasInteractedRef.current,
  };
}
