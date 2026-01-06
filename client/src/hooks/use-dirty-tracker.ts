import { useState, useCallback, useRef, useEffect, useContext } from "react";

interface DirtyTrackerOptions<T extends Record<string, unknown>> {
  initialData?: T;
}

interface DirtyTrackingContextType {
  setDirty: (dirty: boolean) => void;
}

const DirtyTrackingContext = { current: null as DirtyTrackingContextType | null };

export function registerDirtyTrackingContext(context: DirtyTrackingContextType | null) {
  DirtyTrackingContext.current = context;
}

export function useDirtyTracker<T extends Record<string, unknown>>(
  options: DirtyTrackerOptions<T> = {}
) {
  const { initialData } = options;
  const [isDirty, setIsDirtyLocal] = useState(false);
  const baselineRef = useRef<T | undefined>(initialData);
  const currentDataRef = useRef<T | undefined>(initialData);

  const setIsDirty = useCallback((dirty: boolean) => {
    setIsDirtyLocal(dirty);
    DirtyTrackingContext.current?.setDirty(dirty);
  }, []);

  const setBaseline = useCallback((data: T) => {
    baselineRef.current = { ...data };
    currentDataRef.current = { ...data };
    setIsDirty(false);
  }, [setIsDirty]);

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
  }, [setIsDirty]);

  const markClean = useCallback(() => {
    if (currentDataRef.current) {
      baselineRef.current = { ...currentDataRef.current };
    }
    setIsDirty(false);
  }, [setIsDirty]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, [setIsDirty]);

  const reset = useCallback(() => {
    baselineRef.current = undefined;
    currentDataRef.current = undefined;
    setIsDirty(false);
  }, [setIsDirty]);

  useEffect(() => {
    return () => {
      DirtyTrackingContext.current?.setDirty(false);
    };
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
  const [isDirty, setIsDirtyLocal] = useState(false);
  const hasInteractedRef = useRef(false);

  const setIsDirty = useCallback((dirty: boolean) => {
    setIsDirtyLocal(dirty);
    DirtyTrackingContext.current?.setDirty(dirty);
  }, []);

  const markDirty = useCallback(() => {
    hasInteractedRef.current = true;
    setIsDirty(true);
  }, [setIsDirty]);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, [setIsDirty]);

  const reset = useCallback(() => {
    hasInteractedRef.current = false;
    setIsDirty(false);
  }, [setIsDirty]);

  useEffect(() => {
    return () => {
      DirtyTrackingContext.current?.setDirty(false);
    };
  }, []);

  return {
    isDirty,
    markDirty,
    markClean,
    reset,
    hasInteracted: () => hasInteractedRef.current,
  };
}
