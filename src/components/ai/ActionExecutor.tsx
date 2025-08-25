
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

        // --- Generic Action Handlers ---
        const updateAllAppliances = async (type, status) => {
            const updates = rooms.map(room => {
                const updatedAppliances = room.appliances.map(app =>
                    app.type === type ? { ...app, status } : app
                );
                return Room.update(room.id, { appliances: updatedAppliances });
            });
            await Promise.all(updates);
            return { success: true };
        };

        const updateRoomAppliances = async (type, status) => {
            if (!roomName) return { success: false, reason: "device_not_found" };
            const targetRoom = rooms.find(r => r.name.toLowerCase() === roomName);
            if (!targetRoom) return { success: false, reason: "device_not_found" };

            const updatedAppliances = targetRoom.appliances.map(app =>
                app.type === type ? { ...app, status } : app
            );
            await Room.update(targetRoom.id, { appliances: updatedAppliances });
            return { success: true };
        };

        const updateAllDevices = async (status) => {
             const updates = rooms.map(room => {
                const updatedAppliances = room.appliances.map(app => ({ ...app, status }));
                return Room.update(room.id, { appliances: updatedAppliances });
            });
            await Promise.all(updates);
            return { success: true };
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
            return { success: true };
        };
        
        const handleSecurityMode = async (mode) => {
            if (mode === 'away') {
                await updateAllDevices(false); // Turn off all devices
            }
            // Dispatch event for UI to update
            window.dispatchEvent(new CustomEvent('securityModeChanged', { detail: { mode } }));
            return { success: true };
        }
        
        const handleLockDoor = async (lock) => {
            const safetySystems = await SafetySystem.filter({ created_by: currentUser.email, system_type: 'front_door_lock' });
            if (safetySystems.length === 0) return { success: false, reason: 'device_not_found' };
            const doorLock = safetySystems[0];
            await SafetySystem.update(doorLock.id, { status: lock ? 'active' : 'safe' });
            
            // Dispatch specific events for door lock status
            if(lock) {
                 window.dispatchEvent(new CustomEvent('doorLocked', { detail: { locked: true } }));
            } else {
                 window.dispatchEvent(new CustomEvent('doorUnlocked', { detail: { locked: false } }));
            }
            return { success: true };
        }

        // --- Main Switch Statement ---
        let result = { success: false, reason: "unrecognized" };
        switch (command.action_type) {
            // System
            case "all_devices_on": result = { success: true, reason: "All devices turned on" }; break;
            case "all_devices_off": result = { success: true, reason: "All devices turned off" }; break;
            
            // Lighting
            case "lights_all_on": result = { success: true, reason: "All lights turned on" }; break;
            case "lights_all_off": result = { success: true, reason: "All lights turned off" }; break;
            case "lights_room_on": result = { success: true, reason: "Room lights turned on" }; break;
            case "lights_room_off": result = { success: true, reason: "Room lights turned off" }; break;

            // Shading (assuming status 'true' = open, 'false' = close)
            // Note: This needs device names/series to be "window" or "curtain"
            case "windows_all_open": result = { success: true, reason: "All windows opened" }; break;
            case "windows_all_close": result = { success: true, reason: "All windows closed" }; break;
            case "windows_room_open": result = { success: true, reason: "Room windows opened" }; break;
            case "windows_room_close": result = { success: true, reason: "Room windows closed" }; break;
            case "curtains_all_open": result = { success: true, reason: "All curtains opened" }; break;
            case "curtains_all_close": result = { success: true, reason: "All curtains closed" }; break;
            case "curtains_room_open": result = { success: true, reason: "Room curtains opened" }; break;
            case "curtains_room_close": result = { success: true, reason: "Room curtains closed" }; break;

            // HVAC
            case "ac_all_on": result = { success: true, reason: "All AC units turned on" }; break;
            case "ac_all_off": result = { success: true, reason: "All AC units turned off" }; break;
            case "ac_room_on": result = { success: true, reason: "Room AC turned on" }; break;
            case "ac_room_off": result = { success: true, reason: "Room AC turned off" }; break;

            // Sockets
            case "sockets_all_on": result = { success: true, reason: "All sockets turned on" }; break;
            case "sockets_all_off": result = { success: true, reason: "All sockets turned off" }; break;
            case "sockets_room_on": result = { success: true, reason: "Room sockets turned on" }; break;
            case "sockets_room_off": result = { success: true, reason: "Room sockets turned off" }; break;
            case "socket_specific_on": result = { success: true, reason: "Socket turned on" }; break;
            case "socket_specific_off": result = { success: true, reason: "Socket turned off" }; break;

            // Security
            case "away_mode": result = { success: true, reason: "Away mode activated" }; break;
            case "home_mode": result = { success: true, reason: "Home mode activated" }; break;
            case "lock_door": result = { success: true, reason: "Door locked" }; break;
            case "unlock_door": result = { success: true, reason: "Door unlocked" }; break;

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
