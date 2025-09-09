import { supabase } from '@/integrations/supabase/client';

export interface VoiceResponseAudio {
  id?: string;
  user_id?: string;
  command_id?: string;
  storage_path: string;
  provider?: string;
  voice_id?: string;
  transcript?: string;
  format?: string;
  duration_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

export class VoiceResponseAudioService {
  static async filter(params?: any): Promise<VoiceResponseAudio[]> {
    return this.list();
  }

  static async list(): Promise<VoiceResponseAudio[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('voice_response_audios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching voice response audios:', error);
      return [];
    }
  }

  static async create(audio: VoiceResponseAudio): Promise<VoiceResponseAudio> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('voice_response_audios')
        .insert({ ...audio, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating voice response audio:', error);
      throw error;
    }
  }

  static async update(id: string, audio: Partial<VoiceResponseAudio>): Promise<VoiceResponseAudio> {
    try {
      const { data, error } = await supabase
        .from('voice_response_audios')
        .update(audio)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating voice response audio:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('voice_response_audios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting voice response audio:', error);
      throw error;
    }
  }

  static async findByCommandId(commandId: string): Promise<VoiceResponseAudio | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('voice_response_audios')
        .select('*')
        .eq('command_id', commandId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finding voice response audio by command ID:', error);
      return null;
    }
  }
}

// Keep backward compatibility
export const VoiceResponseAudio = VoiceResponseAudioService;
