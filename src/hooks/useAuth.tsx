import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/entities/all';
import { UserSettingsService } from '@/entities/UserSettings';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: any | null;
  session: Session | null;
  isLoading: boolean;
  isNewLogin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isNewLogin: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewLogin, setIsNewLogin] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = User.onAuthStateChange((session) => {
      const wasLoggedOut = !session;
      const isNowLoggedIn = !!session?.user;
      
      setSession(session);
      
      if (session?.user) {
        // Check if this is a new login (transition from no session to session)
        if (wasLoggedOut && isNowLoggedIn) {
          setIsNewLogin(true);
          
          // Update last_login_at in user settings
          setTimeout(async () => {
            try {
              await UserSettingsService.upsert({ 
                last_login_at: new Date().toISOString() 
              });
            } catch (error) {
              console.error('Error updating last login time:', error);
            }
          }, 0);
        }
        
        // Defer user data fetching to avoid blocking auth state changes
        setTimeout(async () => {
          try {
            const userData = await User.me();
            setUser(userData);
            
            // Reset isNewLogin flag after a short delay
            setTimeout(() => setIsNewLogin(false), 2000);
          } catch (error) {
            console.error('Error fetching user data:', error);
            setUser(null);
          }
        }, 0);
      } else {
        setUser(null);
        setIsNewLogin(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isNewLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};