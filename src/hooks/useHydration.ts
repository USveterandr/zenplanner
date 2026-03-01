import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Hook to check if the Zustand store has been hydrated from localStorage
 * This prevents hydration mismatches between server and client
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);
  const storeHydrated = useAppStore((state) => state._hasHydrated);

  useEffect(() => {
    // Check if store is hydrated
    if (storeHydrated) {
      setHydrated(true);
    }
  }, [storeHydrated]);

  // Also set hydrated after a short delay as a fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return hydrated;
}
