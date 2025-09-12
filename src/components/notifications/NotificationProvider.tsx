import { ReactNode } from 'react';
import { Toaster } from 'sonner';

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  return (
    <>
      {children}
      <Toaster 
        position="top-center"
        richColors
        closeButton
        duration={5000}
      />
    </>
  );
};