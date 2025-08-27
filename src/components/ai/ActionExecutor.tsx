import { User, Room, SafetySystem } from "@/entities/all";

class ActionExecutor {
    async execute(command, transcript) {
        if (!command || !command.action_type) {
            return { success: false, message: "No action type defined." };
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
        const extractRoomName = () => {
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

        const roomName = extractRoomName();
        const socketName = extractSocketName();

        // --- Safety System Synchronization Helper ---
        const syncShadesWithSafety = async (type, isOpen, roomName = null) => {
            try {
                const safetySystems = await SafetySystem.filter({ created_by: currentUser.email });
                const windowSystems = safetySystems.filter(sys => 
                    sys.system_type === 'window_rain' && 
                    (roomName ? sys.room_name.toLowerCase() === roomName : true)
                );
                
                for (const system of windowSystems) {
                    await SafetySystem.update(system.id, {
                        sensor_readings: {
                            ...system.sensor_readings,
                            window_status: isOpen ? 'open' : 'closed'
                        }
                    });
                }
            } catch (error) {
                console.error('Error syncing with safety systems:', error);
            }
        };

        // --- Generic Action Handlers ---
        const updateAllAppliances = async (type, status) => {
            const updates = rooms.map(room => {
                const updatedAppliances = room.appliances.map(app =>
                    app.type === type ? { ...app, status } : app
                );
                return Room.update(room.id, { appliances: updatedAppliances });
            });
            await Promise.all(updates);
            return { success: true, reason: `All ${type} ${status ? 'turned on' : 'turned off'}` };
        };

        const updateRoomAppliances = async (type, status) => {
            if (!roomName) return { success: false, reason: "device_not_found" };
            const targetRoom = rooms.find(r => r.name.toLowerCase() === roomName);
            if (!targetRoom) return { success: false, reason: "device_not_found" };

            const updatedAppliances = targetRoom.appliances.map(app =>
                app.type === type ? { ...app, status } : app
            );
            await Room.update(targetRoom.id, { appliances: updatedAppliances });
            return { success: true, reason: `${roomName} ${type} ${status ? 'turned on' : 'turned off'}` };
        };

        const updateAllDevices = async (status) => {
             const updates = rooms.map(room => {
                const updatedAppliances = room.appliances.map(app => ({ ...app, status }));
                return Room.update(room.id, { appliances: updatedAppliances });
            });
            await Promise.all(updates);
            return { success: true, reason: `All devices ${status ? 'turned on' : 'turned off'}` };
        };
        
        const updateSpecificSocket = async (status) => {
            if (!roomName || !socketName) return { success: false, reason: "device_not_found" };
            const targetRoom = rooms.find(r => r.name.toLowerCase() === roomName);
            if (!targetRoom) return { success: false, reason: "device_not_found" };

            let deviceFound = false;
            const updatedAppliances = targetRoom.appliances.map(app => {
                if (app.type === 'smart_socket' && app.name.toLowerCase().includes(socketName)) {
                    deviceFound = true;
                    return { ...app, status };
                }
                return app;
            });

            if (!deviceFound) return { success: false, reason: "device_not_found" };
            
            await Room.update(targetRoom.id, { appliances: updatedAppliances });
            return { success: true, reason: `${roomName} ${socketName} socket ${status ? 'turned on' : 'turned off'}` };
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
                // Create a door lock safety system if it doesn't exist
                const safetySystems = await SafetySystem.list();
                let doorLockSystem = safetySystems.find(sys => 
                    sys.system_type === 'gas_leak' && sys.room_name === 'Front Door' // Use gas_leak as proxy for door lock
                );
                
                if (!doorLockSystem) {
                    // Create a door lock system using available system type
                    doorLockSystem = await SafetySystem.create({
                        system_id: 'door_lock_001',
                        system_type: 'gas_leak', // Using available type as proxy
                        room_name: 'Front Door',
                        status: 'safe',
                        sensor_readings: { door_locked: false }
                    });
                }
                
                if (doorLockSystem) {
                    await SafetySystem.update(doorLockSystem.id, { 
                        status: lock ? 'active' : 'safe',
                        sensor_readings: {
                            ...doorLockSystem.sensor_readings,
                            door_locked: lock
                        }
                    });
                }
                
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
            
            // Lighting
            case "lights_all_on": result = await updateAllAppliances('smart_lighting', true); break;
            case "lights_all_off": result = await updateAllAppliances('smart_lighting', false); break;
            case "lights_room_on": result = await updateRoomAppliances('smart_lighting', true); break;
            case "lights_room_off": result = await updateRoomAppliances('smart_lighting', false); break;

            // Shading - sync with safety systems
            case "windows_all_open": 
                result = await updateAllAppliances('smart_shading', true);
                await syncShadesWithSafety('window', true);
                break;
            case "windows_all_close": 
                result = await updateAllAppliances('smart_shading', false);
                await syncShadesWithSafety('window', false);
                break;
            case "windows_room_open": 
                result = await updateRoomAppliances('smart_shading', true);
                await syncShadesWithSafety('window', true, roomName);
                break;
            case "windows_room_close": 
                result = await updateRoomAppliances('smart_shading', false);
                await syncShadesWithSafety('window', false, roomName);
                break;
            case "curtains_all_open": result = await updateAllAppliances('smart_shading', true); break;
            case "curtains_all_close": result = await updateAllAppliances('smart_shading', false); break;
            case "curtains_room_open": result = await updateRoomAppliances('smart_shading', true); break;
            case "curtains_room_close": result = await updateRoomAppliances('smart_shading', false); break;

            // HVAC
            case "ac_all_on": result = await updateAllAppliances('smart_ac', true); break;
            case "ac_all_off": result = await updateAllAppliances('smart_ac', false); break;
            case "ac_room_on": result = await updateRoomAppliances('smart_ac', true); break;
            case "ac_room_off": result = await updateRoomAppliances('smart_ac', false); break;

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
            case "system_check":
            case "energy_report":
            case "introduction":
            case "help":
                result = { success: true, reason: "Action completed" };
                break;
            
            default:
                console.warn(`Unhandled action type: ${command.action_type}`);
                result = { success: true, reason: `Action '${command.action_type}' acknowledged but not implemented.` };
        }


        if (result.success) {
            window.dispatchEvent(new CustomEvent('systemStateChanged'));
        }

        return result;
    }
}

export default new ActionExecutor();
