import { Room, UserSettings } from "@/entities/all";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class SecurityAutoLockService {
  private static timer: NodeJS.Timeout | null = null;
  private static isCountdownActive = false;
  private static countdownToast: string | number | null = null;

  /**
   * Start the 90-second auto-lock countdown
   * This will turn off all automation devices (except exceptions) when timer completes
   */
  static startAutoLockCountdown(): void {
    // Clear any existing timer
    this.cancelAutoLockCountdown();

    this.isCountdownActive = true;
    
    // Show countdown toast
    this.countdownToast = toast("Security Auto-Lock Armed", {
      description: "All devices will turn off in 90 seconds. Change security mode to cancel.",
      action: {
        label: "Cancel",
        onClick: () => this.cancelAutoLockCountdown()
      },
      duration: 90000
    });

    // Start 90-second countdown
    this.timer = setTimeout(async () => {
      try {
        await this.executeAutoLockShutdown();
      } catch (error) {
        console.error('Auto-lock shutdown failed:', error);
        toast.error("Auto-lock failed", {
          description: "Unable to turn off devices automatically."
        });
      } finally {
        this.isCountdownActive = false;
        this.timer = null;
      }
    }, 90000); // 90 seconds

    console.log('Auto-lock countdown started - devices will turn off in 90 seconds');
  }

  /**
   * Cancel the auto-lock countdown
   */
  static cancelAutoLockCountdown(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.isCountdownActive) {
      this.isCountdownActive = false;
      
      // Dismiss countdown toast
      if (this.countdownToast) {
        toast.dismiss(this.countdownToast);
        this.countdownToast = null;
      }

      toast.success("Auto-lock cancelled", {
        description: "Device shutdown has been cancelled."
      });
      
      console.log('Auto-lock countdown cancelled');
    }
  }

  /**
   * Execute the actual device shutdown with exceptions
   */
  private static async executeAutoLockShutdown(): Promise<void> {
    console.log('Executing auto-lock device shutdown...');

    try {
      // Get user settings to check exceptions
      const userSettings = await UserSettings.list();
      const shutdownExceptions = userSettings[0]?.security_settings?.shutdown_exceptions || [];
      
      // Get all user rooms
      const rooms = await Room.list();
      
      let totalDevicesShutdown = 0;
      const updatedRooms: { id: string; appliances: any[] }[] = [];

      // Process each room
      for (const room of rooms) {
        if (!room.appliances?.length) continue;

        let hasChanges = false;
        const updatedAppliances = room.appliances.map(appliance => {
          // Skip if device is in exceptions list
          if (shutdownExceptions.includes(appliance.child_device_id || appliance.id)) {
            return appliance;
          }

          // Skip if already off
          if (!appliance.status) {
            return appliance;
          }

          // Turn off the device
          hasChanges = true;
          totalDevicesShutdown++;
          return { ...appliance, status: false };
        });

        if (hasChanges) {
          // Update room in database
          await Room.update(room.id!, { appliances: updatedAppliances });
          updatedRooms.push({ id: room.id!, appliances: updatedAppliances });

          // Update child devices in backend if they have child_device_ids
          const appliancesWithChildIds = updatedAppliances.filter(app => app.child_device_id && !app.status);
          
          for (const appliance of appliancesWithChildIds) {
            try {
              const newState = {
                status: false,
                intensity: appliance.intensity || 0,
                color_tint: appliance.color_tint || 'white',
                auto_mode: appliance.auto_mode || false,
                power_usage: appliance.power_usage || 0
              };

              const { error } = await supabase
                .from('child_devices')
                .update({ state: newState })
                .eq('id', appliance.child_device_id);

              if (error) {
                console.error(`Failed to update child device ${appliance.child_device_id}:`, error);
              }
            } catch (error) {
              console.error(`Error updating child device ${appliance.child_device_id}:`, error);
            }
          }
        }
      }

      // Dispatch events to update UI in real-time
      for (const roomUpdate of updatedRooms) {
        window.dispatchEvent(new CustomEvent('roomApplianceUpdated', {
          detail: { roomId: roomUpdate.id }
        }));
      }

      // Show completion toast
      toast.success("Auto-lock completed", {
        description: `${totalDevicesShutdown} devices turned off. Exceptions preserved.`
      });

      console.log(`Auto-lock completed: ${totalDevicesShutdown} devices turned off, ${shutdownExceptions.length} exceptions preserved`);

    } catch (error) {
      console.error('Error during auto-lock shutdown:', error);
      throw error;
    }
  }

  /**
   * Check if countdown is currently active
   */
  static isCountdownRunning(): boolean {
    return this.isCountdownActive;
  }

  /**
   * Get remaining time in seconds (for UI display)
   */
  static getRemainingTime(): number {
    if (!this.isCountdownActive || !this.timer) return 0;
    // This is approximate since we don't track exact start time
    return 90; // For simplicity, always show 90s when active
  }

  /**
   * Clean up timers on app unmount
   */
  static cleanup(): void {
    this.cancelAutoLockCountdown();
  }
}