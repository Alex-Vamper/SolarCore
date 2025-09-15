
import { User, Room, ChildDevice, SecuritySystem, UserSettings } from "@/entities/all";
import { supabase } from "@/integrations/supabase/client";
import { deviceCapabilitiesCache } from "@/lib/deviceCapabilitiesCache";
import { deviceStateService } from "@/lib/deviceStateService";
import { deviceStateLogger } from "@/lib/deviceStateLogger";

class ActionExecutor {
    // Enhanced device availability checker using capabilities cache
    async ensureDeviceAvailable(actionType, roomName = null) {
        try {
            // Use cached capabilities for fast checking
            const canExecute = await deviceCapabilitiesCache.canExecuteAction(actionType, roomName);
            if (!canExecute) {
                return { available: false, reason: 'device_not_found' };
            }
            
            // Additional security device checks for security actions
            const securityActions = ['away_mode', 'home_mode', 'lock_door', 'unlock_door'];
            if (securityActions.includes(actionType)) {
                const settings = await UserSettings.list();
                if (settings.length === 0 || !settings[0].security_settings?.door_security_id) {
                    return { available: false, reason: 'device_not_found' };
                }
            }
            
            return { available: true };
        } catch (error) {
            console.error('Error checking device availability:', error);
            return { available: false, reason: 'device_not_found' };
        }
    }

    async execute(command, transcript) {
        if (!command || !command.action_type) {
            return { success: false, message: "No action type defined." };
        }
        
        // Extract room name for room-specific availability checks
        const extractRoomName = () => {
            const roomKeywords = ["living room", "dining room", "kitchen", "bedroom"];
            for (const rk of roomKeywords) {
                if (transcript.toLowerCase().includes(rk)) return rk;
            }
            return null;
        };
        
        const roomName = command.action_type.includes('room') ? extractRoomName() : null;
        
        // Check device availability before executing action
        const deviceCheck = await this.ensureDeviceAvailable(command.action_type, roomName);
        if (!deviceCheck.available) {
            return { success: false, reason: deviceCheck.reason };
        }
        
        // --- PRIORITY: Direct Device Control from Linked Command ---
        if (command.action_type === 'device_control' && command.target_room_id && command.target_appliance_id) {
            try {
                const room = await Room.get(command.target_room_id);
                if (!room) return { success: false, reason: "device_not_found" };

                let applianceFound = false;
                const updatedAppliances = room.appliances.map(app => {
                    if (app.id === command.target_appliance_id) {
                        applianceFound = true;
                        // Parse the stored string value to its correct type (boolean for now)
                        const newState = command.target_state_value === 'true';
                        return { ...app, [command.target_state_key]: newState };
                    }
                    return app;
                });

                if (!applianceFound) return { success: false, reason: "device_not_found" };

                await Room.update(room.id, { appliances: updatedAppliances });
                window.dispatchEvent(new CustomEvent('systemStateChanged'));
                return { success: true };

            } catch (error) {
                console.error("Error in direct device control:", error);
                return { success: false, reason: "execution_error" };
            }
        }

        // --- FALLBACK: Keyword-Based General Commands ---
        const currentUser = await User.me();
        const rooms = await Room.filter({ created_by: currentUser.email });

        // --- Parameter Extraction ---
        const extractRoomNameForSocket = () => {
            const roomKeywords = ["living room", "dining room", "kitchen", "bedroom"];
            for (const rk of roomKeywords) {
                if (transcript.toLowerCase().includes(rk)) return rk;
            }
            return null;
        };

        const extractSocketName = () => {
            const socketKeywords = ["tv socket", "dispenser socket", "free socket"];
             for (const sk of socketKeywords) {
                if (transcript.toLowerCase().includes(sk)) return sk.replace(' socket', '');
            }
            return null;
        }

        const roomNameForSocket = extractRoomNameForSocket();
        const socketName = extractSocketName();

        // --- Safety System Synchronization Helper ---
        const syncShadesWithSafety = async (type, isOpen, roomName = null) => {
            try {
                const safetySystems = await ChildDevice.getSafetyDevices();
                const windowSystems = safetySystems.filter(sys => 
                    sys.device_type?.device_series === 'window_rain' && 
                    (roomName ? sys.state?.room_name?.toLowerCase() === roomName : true)
                );
                
                for (const system of windowSystems) {
                    await ChildDevice.update(system.id, {
                        state: {
                            ...system.state,
                            window_status: isOpen ? 'open' : 'closed'
                        }
                    });
                }
            } catch (error) {
                console.error('Error syncing with safety systems:', error);
            }
        };

        // --- Generic Action Handlers with Backend Sync ---
        const updateAllAppliances = async (type, status) => {
            deviceStateLogger.logVoiceCommand(`updateAllAppliances_${type}`, transcript, { status });
            
            let devicesUpdated = 0;
            const roomUpdates = [];

            for (const room of rooms) {
                const appliancesToUpdate = room.appliances.filter(app => app.type === type);
                if (appliancesToUpdate.length > 0) {
                    const applianceUpdates = appliancesToUpdate.map(app => ({
                        id: app.id,
                        updates: { status }
                    }));
                    
                    roomUpdates.push({
                        roomId: room.id,
                        applianceUpdates
                    });
                    
                    devicesUpdated += appliancesToUpdate.length;
                }
            }
            
            if (devicesUpdated === 0) {
                deviceStateLogger.log('ACTION_EXECUTOR', `No ${type} devices found to update`);
                return { success: false, reason: 'device_not_found' };
            }

            // Use unified device state service for backend sync
            const result = await deviceStateService.updateMultipleDevices(roomUpdates);
            
            if (!result.success) {
                deviceStateLogger.logError('ACTION_EXECUTOR', `Failed to update ${type} devices`, result.errors);
                return { success: false, reason: 'update_failed' };
            }

            deviceStateLogger.log('ACTION_EXECUTOR', `Successfully updated ${devicesUpdated} ${type} devices`);
            return { success: true, reason: `All ${type} ${status ? 'turned on' : 'turned off'}` };
        };

        const updateRoomAppliances = async (type, status) => {
            deviceStateLogger.logVoiceCommand(`updateRoomAppliances_${type}`, transcript, { status, roomName });
            
            if (!roomName) return { success: false, reason: "device_not_found" };
            const targetRoom = rooms.find(r => r.name.toLowerCase() === roomName);
            if (!targetRoom) return { success: false, reason: "device_not_found" };

            // Filter appliances by type - ensure we only update the correct type
            const appliancesToUpdate = targetRoom.appliances.filter(app => {
                if (type === 'smart_lighting') {
                    return app.type === 'smart_lighting';
                } else if (type === 'smart_shading') {
                    return app.type === 'smart_shading';
                }
                return app.type === type;
            });
            
            if (appliancesToUpdate.length === 0) {
                deviceStateLogger.log('ACTION_EXECUTOR', `No ${type} devices found in ${roomName}`);
                return { success: false, reason: "device_not_found" };
            }

            // Update each device individually to prevent cross-contamination
            const updatePromises = appliancesToUpdate.map(appliance => 
                deviceStateService.updateDeviceState(targetRoom.id, appliance.id, { status })
            );
            
            const results = await Promise.all(updatePromises);
            const successCount = results.filter(r => r.success).length;
            
            if (successCount === 0) {
                deviceStateLogger.logError('ACTION_EXECUTOR', `Failed to update any ${type} devices in ${roomName}`);
                return { success: false, reason: 'update_failed' };
            }
            
            if (successCount < appliancesToUpdate.length) {
                deviceStateLogger.log('ACTION_EXECUTOR', `Partially updated ${successCount} of ${appliancesToUpdate.length} ${type} devices in ${roomName}`);
                return { success: true, reason: `Some ${roomName} ${type} ${status ? 'turned on' : 'turned off'}` };
            }

            deviceStateLogger.log('ACTION_EXECUTOR', `Successfully updated ${successCount} ${type} devices in ${roomName}`);
            return { success: true, reason: `${roomName} ${type} ${status ? 'turned on' : 'turned off'}` };
        };

        const updateAllDevices = async (status) => {
            deviceStateLogger.logVoiceCommand('updateAllDevices', transcript, { status });
            
            // Update each room's devices individually
            const updatePromises = [];
            
            for (const room of rooms) {
                for (const appliance of room.appliances) {
                    updatePromises.push(
                        deviceStateService.updateDeviceState(room.id, appliance.id, { status })
                    );
                }
            }
            
            const results = await Promise.all(updatePromises);
            const successCount = results.filter(r => r.success).length;
            const totalDevices = updatePromises.length;
            
            if (successCount === 0) {
                deviceStateLogger.logError('ACTION_EXECUTOR', 'Failed to update any devices');
                return { success: false, reason: 'update_failed' };
            }
            
            if (successCount < totalDevices) {
                deviceStateLogger.log('ACTION_EXECUTOR', `Partially updated ${successCount} of ${totalDevices} devices`);
                return { success: true, reason: `Some devices ${status ? 'turned on' : 'turned off'}` };
            }

            deviceStateLogger.log('ACTION_EXECUTOR', `Successfully updated ${successCount} devices`);
            return { success: true, reason: `All devices ${status ? 'turned on' : 'turned off'}` };
        };
        
        const updateSpecificSocket = async (status) => {
            deviceStateLogger.logVoiceCommand('updateSpecificSocket', transcript, { status, roomNameForSocket, socketName });
            
            if (!roomNameForSocket || !socketName) return { success: false, reason: "device_not_found" };
            const targetRoom = rooms.find(r => r.name.toLowerCase() === roomNameForSocket);
            if (!targetRoom) return { success: false, reason: "device_not_found" };

            const targetSocket = targetRoom.appliances.find(app => 
                app.type === 'smart_socket' && app.name.toLowerCase().includes(socketName)
            );

            if (!targetSocket) {
                deviceStateLogger.log('ACTION_EXECUTOR', `Socket '${socketName}' not found in ${roomNameForSocket}`);
                return { success: false, reason: "device_not_found" };
            }

            const roomUpdates = [{
                roomId: targetRoom.id,
                applianceUpdates: [{
                    id: targetSocket.id,
                    updates: { status }
                }]
            }];

            // Use unified device state service for backend sync
            const result = await deviceStateService.updateMultipleDevices(roomUpdates);
            
            if (!result.success) {
                deviceStateLogger.logError('ACTION_EXECUTOR', `Failed to update socket ${socketName}`, result.errors);
                return { success: false, reason: 'update_failed' };
            }

            deviceStateLogger.log('ACTION_EXECUTOR', `Successfully updated socket ${socketName} in ${roomNameForSocket}`);
            return { success: true, reason: `${roomNameForSocket} ${socketName} socket ${status ? 'turned on' : 'turned off'}` };
        };
        
        const handleSecurityMode = async (mode) => {
            if (mode === 'away') {
                await updateAllDevices(false); // Turn off all devices
            }
            // Dispatch event for UI to update
            window.dispatchEvent(new CustomEvent('securityModeChanged', { detail: { mode } }));
            return { success: true, reason: `${mode} mode activated` };
        }
        
        const handleLockDoor = async (lock) => {
            try {
                // Check for existing security system or create one
                const securitySystems = await SecuritySystem.list();
                let doorLockSystem = securitySystems.find(sys => 
                    sys.system_type === 'door_control'
                );
                
                if (!doorLockSystem) {
                    // Create a door lock system in child_devices
                    doorLockSystem = await SecuritySystem.create({
                        system_id: 'door_lock_001',
                        system_type: 'door_control',
                        lock_status: 'unlocked',
                        security_mode: 'home'
                    });
                }
                
                // Update the security system state
                await SecuritySystem.update(doorLockSystem.id, { 
                    lock_status: lock ? 'locked' : 'unlocked',
                    security_mode: lock ? 'away' : 'home',
                    last_action: `door_${lock ? 'locked' : 'unlocked'}_${new Date().toISOString()}`
                });
                
                // Dispatch events for SecurityOverview to listen
                if(lock) {
                    window.dispatchEvent(new CustomEvent('doorLocked', { detail: { locked: true } }));
                    // Auto-activate security mode when door is locked
                    window.dispatchEvent(new CustomEvent('securityModeChanged', { detail: { mode: 'away' } }));
                } else {
                    window.dispatchEvent(new CustomEvent('doorUnlocked', { detail: { locked: false } }));
                }
                
                return { success: true, reason: `Front door ${lock ? 'locked' : 'unlocked'}` };
            } catch (error) {
                console.error('Error in handleLockDoor:', error);
                return { success: false, reason: 'execution_error' };
            }
        }

        // --- Main Switch Statement ---
        let result = { success: false, reason: "unrecognized" };
        switch (command.action_type) {
            // System
            case "all_devices_on": result = await updateAllDevices(true); break;
            case "all_devices_off": result = await updateAllDevices(false); break;
            
            // Lighting - ensure proper device type filtering
            case "lights_all_on": result = await updateAllAppliances('smart_lighting', true); break;
            case "lights_all_off": result = await updateAllAppliances('smart_lighting', false); break;
            case "lights_room_on": 
                // Only update lighting devices in the specific room
                result = await updateRoomAppliances('smart_lighting', true); 
                break;
            case "lights_room_off": 
                // Only update lighting devices in the specific room
                result = await updateRoomAppliances('smart_lighting', false); 
                break;

            // Shading - ensure only window/shading devices are updated
            case "windows_all_open": 
                result = await updateAllAppliances('smart_shading', true);
                await syncShadesWithSafety('window', true);
                break;
            case "windows_all_close": 
                result = await updateAllAppliances('smart_shading', false);
                await syncShadesWithSafety('window', false);
                break;
            case "windows_room_open": 
                // Only update shading devices in the specific room
                result = await updateRoomAppliances('smart_shading', true);
                await syncShadesWithSafety('window', true, roomName);
                break;
            case "windows_room_close": 
                // Only update shading devices in the specific room
                result = await updateRoomAppliances('smart_shading', false);
                await syncShadesWithSafety('window', false, roomName);
                break;
            case "curtains_all_open": result = await updateAllAppliances('smart_shading', true); break;
            case "curtains_all_close": result = await updateAllAppliances('smart_shading', false); break;
            case "curtains_room_open": result = await updateRoomAppliances('smart_shading', true); break;
            case "curtains_room_close": result = await updateRoomAppliances('smart_shading', false); break;

            // HVAC
            case "ac_all_on": result = await updateAllAppliances('smart_hvac', true); break;
            case "ac_all_off": result = await updateAllAppliances('smart_hvac', false); break;
            case "ac_room_on": result = await updateRoomAppliances('smart_hvac', true); break;
            case "ac_room_off": result = await updateRoomAppliances('smart_hvac', false); break;

            // Sockets
            case "sockets_all_on": result = await updateAllAppliances('smart_socket', true); break;
            case "sockets_all_off": result = await updateAllAppliances('smart_socket', false); break;
            case "sockets_room_on": result = await updateRoomAppliances('smart_socket', true); break;
            case "sockets_room_off": result = await updateRoomAppliances('smart_socket', false); break;
            case "socket_specific_on": result = await updateSpecificSocket(true); break;
            case "socket_specific_off": result = await updateSpecificSocket(false); break;

            // Security - real implementation with safety system sync
            case "away_mode": result = await handleSecurityMode('away'); break;
            case "home_mode": result = await handleSecurityMode('home'); break;
            case "lock_door": result = await handleLockDoor(true); break;
            case "unlock_door": result = await handleLockDoor(false); break;

            // Non-state-changing actions
            case "wake_up":
            case "energy_report":
            case "introduction":
            case "help":
                result = { success: true, reason: "Action completed" };
                break;
            
            // System check - trigger the systems check in QuickActions
            case "system_check":
            case "all_systems_check":
                window.dispatchEvent(new CustomEvent('triggerSystemsCheck'));
                result = { success: true, reason: "Systems check initiated" };
                break;
            
            default:
                console.warn(`Unhandled action type: ${command.action_type}`);
                result = { success: true, reason: `Action '${command.action_type}' acknowledged but not implemented.` };
        }


        if (result.success) {
            // Dispatch specific events for different state changes
            window.dispatchEvent(new CustomEvent('systemStateChanged', {
              detail: { success: true, command: command.action_type }
            }));
            window.dispatchEvent(new CustomEvent('deviceStateChanged', {
              detail: { success: true, command: command.action_type }
            }));
            window.dispatchEvent(new CustomEvent('applianceStateChanged', {
              detail: { success: true, command: command.action_type }
            }));
            window.dispatchEvent(new CustomEvent('roomStateChanged', {
              detail: { success: true, command: command.action_type }
            }));
            window.dispatchEvent(new CustomEvent('safetyStateChanged', {
              detail: { success: true, command: command.action_type }
            }));
        }

        return result;
    }
}

export default new ActionExecutor();
