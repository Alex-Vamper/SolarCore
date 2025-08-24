
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { VoiceCommand, Room } from '@/entities/all';
import { AlertTriangle, Trash2, Link as LinkIcon } from 'lucide-react';

export default function CommandEditorModal({ isOpen, onClose, command, onSave }) {
  const [editedCommand, setEditedCommand] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState([]);
  const [availableAppliances, setAvailableAppliances] = useState([]);

  useEffect(() => {
    const loadDeviceData = async () => {
        try {
            const roomData = await Room.list();
            setRooms(roomData);
        } catch (err) {
            console.error("Failed to load rooms", err);
            setError("Could not load device data for linking.");
        }
    };
    
    if (isOpen) {
        loadDeviceData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (command) {
      // If editing, populate with command data.
      const newEditedCommand = {
        ...command,
        keywords: command.keywords?.join(', ') || '',
      };
      setEditedCommand(newEditedCommand);

      // If a room is already linked, populate the appliances dropdown
      if (newEditedCommand.target_room_id) {
        const selectedRoom = rooms.find(r => r.id === newEditedCommand.target_room_id);
        setAvailableAppliances(selectedRoom?.appliances || []);
      } else {
        setAvailableAppliances([]);
      }

    } else {
      // If new, start with a blank slate
      setEditedCommand({
        command_category: 'custom',
        command_name: '',
        keywords: '',
        response: '',
        action_type: 'device_control', // Default to device control for new commands
        target_room_id: null,
        target_appliance_id: null,
        target_state_key: 'status', // Default to toggling on/off
        target_state_value: 'true',
      });
      setAvailableAppliances([]);
    }
    setError('');
  }, [command, isOpen, rooms]);

  const isNewCommand = !command?.id;

  const handleRoomChange = (roomId) => {
      handleChange('target_room_id', roomId);
      const selectedRoom = rooms.find(r => r.id === roomId);
      setAvailableAppliances(selectedRoom?.appliances || []);
      // Reset appliance selection when room changes
      handleChange('target_appliance_id', null);
  };

  const handleChange = (field, value) => {
    setEditedCommand(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    if (!editedCommand.command_name || !editedCommand.keywords || !editedCommand.response) {
      setError('Command Name, Keywords, and Response are required.');
      setIsLoading(false);
      return;
    }

    try {
      // Convert keywords string back to an array
      const finalCommand = {
        ...editedCommand,
        keywords: editedCommand.keywords.split(',').map(k => k.trim()).filter(Boolean),
        // Ensure nulls are sent if no device is linked
        target_room_id: editedCommand.target_room_id || null,
        target_appliance_id: editedCommand.target_appliance_id || null,
      };

      if (isNewCommand) {
        await VoiceCommand.create(finalCommand);
      } else {
        await VoiceCommand.update(finalCommand.id, finalCommand);
      }
      
      onSave(); // This will trigger a reload on the parent page
      onClose();
    } catch (err) {
      console.error("Failed to save command:", err);
      setError('An error occurred while saving. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isNewCommand || !window.confirm("Are you sure you want to delete this command? This cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
        await VoiceCommand.delete(command.id);
        onSave();
        onClose();
    } catch (err) {
        console.error("Failed to delete command:", err);
        setError('An error occurred while deleting. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-inter">{isNewCommand ? 'Add New Command' : 'Edit Command'}</DialogTitle>
          <DialogDescription className="font-inter">
            Define how Ander understands, responds, and acts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="command_name" className="font-inter">Command Name</Label>
            <Input id="command_name" value={editedCommand.command_name || ''} onChange={e => handleChange('command_name', e.target.value)} placeholder="e.g., Movie Time" className="font-inter" />
          </div>
          <div>
            <Label htmlFor="keywords" className="font-inter">Keywords (comma-separated)</Label>
            <Textarea id="keywords" value={editedCommand.keywords || ''} onChange={e => handleChange('keywords', e.target.value)} placeholder="e.g., let's watch a movie, start movie mode" className="font-inter" />
          </div>
          <div>
            <Label htmlFor="response" className="font-inter">Ander's Response</Label>
            <Input id="response" value={editedCommand.response || ''} onChange={e => handleChange('response', e.target.value)} placeholder="e.g., Okay, setting the mood for a movie." className="font-inter" />
          </div>
           <div>
            <Label htmlFor="command_category" className="font-inter">Category</Label>
            <Input id="command_category" value={editedCommand.command_category || ''} onChange={e => handleChange('command_category', e.target.value)} placeholder="e.g., custom_scenes" className="font-inter" />
            <p className="text-xs text-gray-500 mt-1 font-inter">A new card will be created if the category doesn't exist.</p>
          </div>
          
          <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50/50">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2"><LinkIcon className="w-4 h-4" />Command Action</h4>
            <p className="text-xs text-blue-700 -mt-2">Optionally, link this command to control a specific device.</p>
            
            <div>
                <Label htmlFor="target_room" className="font-inter">Target Room</Label>
                <Select value={editedCommand.target_room_id || ""} onValueChange={handleRoomChange}>
                    <SelectTrigger><SelectValue placeholder="Select a room..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={""}>None</SelectItem> {/* Use empty string for null value in Select */}
                        {rooms.map(room => (
                            <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {editedCommand.target_room_id && (
                <>
                    <div>
                        <Label htmlFor="target_appliance" className="font-inter">Target Appliance</Label>
                        <Select value={editedCommand.target_appliance_id || ""} onValueChange={val => handleChange('target_appliance_id', val)}>
                            <SelectTrigger><SelectValue placeholder="Select an appliance..." /></SelectTrigger>
                            <SelectContent>
                                {availableAppliances.map(app => (
                                    <SelectItem key={app.id} value={app.id}>{app.name} ({app.type.replace(/_/g, ' ')})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {editedCommand.target_appliance_id && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-md">
                           <Label className="font-inter">Set Device State to "On"</Label>
                            <Switch
                                checked={editedCommand.target_state_value === 'true'}
                                onCheckedChange={checked => handleChange('target_state_value', String(checked))}
                            />
                        </div>
                    )}
                </>
            )}
          </div>
        </div>

        {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-inter flex items-center gap-2">
                <AlertTriangle className="w-4 h-4"/>
                {error}
            </div>
        )}

        <DialogFooter className="flex justify-between w-full">
            <div>
             {!isNewCommand && (
                <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                    <Trash2 className="w-4 h-4 mr-2"/>
                    Delete
                </Button>
            )}
           </div>
           <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                    {isLoading ? 'Saving...' : 'Save Command'}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    