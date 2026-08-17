import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface NavigationEntry {
  id: string;
  onBack: () => void;
}

interface NavigationContextType {
  goBack: () => void;
  registerModal: (id: string, onBack: () => void) => () => void;
  stackLength: number;
}

const NavigationContext = createContext<NavigationContextType>({
  goBack: () => {},
  registerModal: () => () => {},
  stackLength: 0,
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stackRef = useRef<NavigationEntry[]>([]);
  const [stackLength, setStackLength] = useState<number>(0);

  const goBack = useCallback(() => {
    if (stackRef.current.length > 0) {
      const topEntry = stackRef.current.pop();
      setStackLength(stackRef.current.length);
      if (topEntry && typeof topEntry.onBack === 'function') {
        topEntry.onBack();
      }
    } else {
      // If stack is empty, fallback to browser history if possible
      if (window.history.length > 1) {
        window.history.back();
      }
    }
  }, []);

  const registerModal = useCallback((id: string, onBack: () => void) => {
    // Prevent duplicate registration for the same ID
    const existingIndex = stackRef.current.findIndex(e => e.id === id);
    if (existingIndex !== -1) {
      stackRef.current.splice(existingIndex, 1);
    }

    const entry: NavigationEntry = { id, onBack };
    stackRef.current.push(entry);
    setStackLength(stackRef.current.length);

    // Push state to browser history for physical/browser back button support
    try {
      window.history.pushState({ navigationModalId: id }, '');
    } catch {
      // Ignore security/origin limits
    }

    return () => {
      const idx = stackRef.current.findIndex(e => e.id === id);
      if (idx !== -1) {
        stackRef.current.splice(idx, 1);
        setStackLength(stackRef.current.length);
      }
    };
  }, []);

  // Listen to browser / hardware popstate events
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (stackRef.current.length > 0) {
        const topEntry = stackRef.current.pop();
        setStackLength(stackRef.current.length);
        if (topEntry && typeof topEntry.onBack === 'function') {
          topEntry.onBack();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <NavigationContext.Provider value={{ goBack, registerModal, stackLength }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
