import React, { createContext, useContext } from 'react';
import { useSecurityState } from '@/hooks/useSecurityState';

interface SecurityContextValue {
  isDoorLocked: boolean;
  isSecurityMode: boolean;
  updateSecurityState: (newState: Partial<{ isDoorLocked: boolean; isSecurityMode: boolean }>) => void;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const securityState = useSecurityState();
  
  return (
    <SecurityContext.Provider value={securityState}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};