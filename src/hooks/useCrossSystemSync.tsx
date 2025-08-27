import { useEffect } from 'react';
import { Room, SafetySystem } from '@/entities/all';

export const useCrossSystemSync = () => {
  useEffect(() => {
    // Listen for room appliance changes and sync with safety systems
    const handleSystemStateChanged = async () => {
      try {
        // Get all rooms and safety systems
        const rooms = await Room.list();
        const safetySystems = await SafetySystem.list();
        
        // Sync smart_shading with window_rain systems
        for (const room of rooms) {
          const windowAppliances = room.appliances.filter(app => app.type === 'smart_shading');
          const windowSafetySystems = safetySystems.filter(sys => 
            sys.system_type === 'window_rain' && sys.room_name.toLowerCase() === room.name.toLowerCase()
          );
          
          for (const windowApp of windowAppliances) {
            for (const safetySystem of windowSafetySystems) {
              const currentWindowStatus = safetySystem.sensor_readings?.window_status || 'closed';
              const newWindowStatus = windowApp.status ? 'open' : 'closed';
              
              if (currentWindowStatus !== newWindowStatus) {
                await SafetySystem.update(safetySystem.id, {
                  sensor_readings: {
                    ...safetySystem.sensor_readings,
                    window_status: newWindowStatus
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in cross-system sync:', error);
      }
    };

    // Listen for both system state changes and safety system changes
    window.addEventListener('systemStateChanged', handleSystemStateChanged);
    
    return () => {
      window.removeEventListener('systemStateChanged', handleSystemStateChanged);
    };
  }, []);
};