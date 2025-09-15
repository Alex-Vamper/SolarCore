import { Room } from "@/entities/all";
import { supabase } from "@/integrations/supabase/client";

export class WindowControlService {
  static async getWindowState(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const rooms = await Room.filter({ created_by: user.email });
      
      // Check if any smart_shading devices are "open" (power: true)
      for (const room of rooms) {
        if (room.appliances) {
          for (const appliance of room.appliances) {
            if (appliance.type === 'smart_shading' && appliance.status === true) {
              return true; // At least one window is open
            }
          }
        }
      }
      
      return false; // All windows are closed
    } catch (error) {
      console.error('Error getting window state:', error);
      return false;
    }
  }

  static async toggleAllWindows(): Promise<{ success: boolean; isOpen: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, isOpen: false, message: 'Authentication required' };
      }

      const rooms = await Room.filter({ created_by: user.email });
      const currentState = await this.getWindowState();
      const newState = !currentState; // Toggle the state
      
      let updatedCount = 0;

      for (const room of rooms) {
        if (room.appliances) {
          const updatedAppliances = room.appliances.map(appliance => {
            if (appliance.type === 'smart_shading') {
              updatedCount++;
              return { ...appliance, status: newState };
            }
            return appliance;
          });

          if (JSON.stringify(updatedAppliances) !== JSON.stringify(room.appliances)) {
            await Room.update(room.id, { appliances: updatedAppliances });
          }
        }
      }

      if (updatedCount === 0) {
        return { 
          success: false, 
          isOpen: false, 
          message: 'No smart shading devices found. Please add window devices to your rooms.' 
        };
      }

      return {
        success: true,
        isOpen: newState,
        message: `${newState ? 'Opened' : 'Closed'} ${updatedCount} window device${updatedCount > 1 ? 's' : ''}`
      };
    } catch (error) {
      console.error('Error toggling windows:', error);
      return { 
        success: false, 
        isOpen: false, 
        message: 'Failed to control windows. Please try again.' 
      };
    }
  }
}