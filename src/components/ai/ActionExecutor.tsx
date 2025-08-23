import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Settings, 
  Lightbulb, 
  Shield, 
  Thermometer, 
  Power,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Room } from "@/entities/all";

interface ActionExecutorProps {
  voiceCommands: any[];
}

export default function ActionExecutor({ voiceCommands }: ActionExecutorProps) {
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const getActionIcon = (actionType: string) => {
    const iconMap: Record<string, JSX.Element> = {
      lights_all_on: <Lightbulb className="w-4 h-4" />,
      lights_all_off: <Lightbulb className="w-4 h-4" />,
      system_all_on: <Power className="w-4 h-4" />,
      system_all_off: <Power className="w-4 h-4" />,
      lock_door: <Shield className="w-4 h-4" />,
      unlock_door: <Shield className="w-4 h-4" />,
      ac_all_on: <Thermometer className="w-4 h-4" />,
      ac_all_off: <Thermometer className="w-4 h-4" />
    };
    return iconMap[actionType] || <Settings className="w-4 h-4" />;
  };

  const executeAction = async (command: any) => {
    setExecutingAction(command.id);
    setLastResult(null);

    try {
      // Simulate action execution based on action_type
      await new Promise(resolve => setTimeout(resolve, 1500));

      let success = false;
      let message = "";

      switch (command.action_type) {
        case 'lights_all_on':
        case 'lights_all_off':
          success = await updateRoomAppliances('lights', command.action_type.includes('_on'));
          message = success ? 
            `Successfully ${command.action_type.includes('_on') ? 'turned on' : 'turned off'} all lights` :
            'Failed to update lighting systems';
          break;

        case 'system_all_on':
        case 'system_all_off':
          success = await updateAllSystems(command.action_type.includes('_on'));
          message = success ? 
            `Successfully ${command.action_type.includes('_on') ? 'activated' : 'deactivated'} all systems` :
            'Failed to update system status';
          break;

        case 'lock_door':
        case 'unlock_door':
          success = await updateDoorLock(command.action_type === 'lock_door');
          message = success ? 
            `Door ${command.action_type === 'lock_door' ? 'locked' : 'unlocked'} successfully` :
            'Failed to update door lock';
          break;

        default:
          success = true;
          message = `Simulated execution of ${command.command_name}`;
      }

      setLastResult({ success, message });
    } catch (error) {
      setLastResult({ 
        success: false, 
        message: `Error executing ${command.command_name}: ${error}` 
      });
    } finally {
      setExecutingAction(null);
    }
  };

  const updateRoomAppliances = async (applianceType: string, turnOn: boolean): Promise<boolean> => {
    try {
      const rooms = await Room.filter({});
      for (const room of rooms) {
        const appliances = room.appliances || [];
        const updatedAppliances = appliances.map((appliance: any) => {
          if (appliance.type === applianceType) {
            return { ...appliance, status: turnOn };
          }
          return appliance;
        });
        await Room.update(room.id, { appliances: updatedAppliances });
      }
      return true;
    } catch (error) {
      console.error('Failed to update room appliances:', error);
      return false;
    }
  };

  const updateAllSystems = async (activate: boolean): Promise<boolean> => {
    try {
      const rooms = await Room.filter({});
      for (const room of rooms) {
        const appliances = room.appliances || [];
        const updatedAppliances = appliances.map((appliance: any) => ({
          ...appliance,
          status: activate
        }));
        await Room.update(room.id, { appliances: updatedAppliances });
      }
      return true;
    } catch (error) {
      console.error('Failed to update all systems:', error);
      return false;
    }
  };

  const updateDoorLock = async (lock: boolean): Promise<boolean> => {
    // Simulate door lock operation
    console.log(`${lock ? 'Locking' : 'Unlocking'} door`);
    return Math.random() > 0.1; // 90% success rate for demo
  };

  const executableCommands = voiceCommands.filter(cmd => 
    cmd.action_type && !['wake_up', 'introduction', 'help', 'status_report'].includes(cmd.action_type)
  );

  return (
    <Card className="glass-card border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-inter">
          <Play className="w-5 h-5 text-green-600" />
          Action Executor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastResult && (
          <Alert variant={lastResult.success ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <AlertDescription>{lastResult.message}</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="space-y-2">
          {executableCommands.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No executable commands available
            </div>
          ) : (
            executableCommands.map((command) => (
              <div
                key={command.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getActionIcon(command.action_type)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{command.command_name}</div>
                    <div className="text-xs text-gray-500">
                      {command.keywords.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {command.action_type}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => executeAction(command)}
                    disabled={executingAction === command.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {executingAction === command.id ? (
                      "Executing..."
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}