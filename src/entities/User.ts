import { supabase } from '@/integrations/supabase/client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_date: string;
}

export class UserService {
  static async me(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || '',
        created_date: user.created_at
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  static async updateMyUserData(data: { full_name?: string }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      if (data.full_name) {
        await supabase
          .from('profiles')
          .update({ full_name: data.full_name })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  static async signUp(email: string, password: string, fullName?: string): Promise<{ error?: any }> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName
          }
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  }

  static async signIn(email: string, password: string): Promise<{ error?: any }> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } catch (error) {
      return { error };
    }
  }

  static onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session);
    });
  }
}

// Keep backward compatibility with existing code
export const User = UserService;