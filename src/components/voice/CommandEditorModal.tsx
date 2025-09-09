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
import { VoiceCommand } from '@/entities/all';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface CommandFormData {
  command_name: string;
  keywords: string;
  response: string;
  command_category: string;
  action_type: string;
}

export default function CommandEditorModal({ isOpen, onClose, command, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  command?: any;
  onSave: () => void;
}) {
  const [editedCommand, setEditedCommand] = useState<CommandFormData>({
    command_name: '',
    keywords: '',
    response: '',
    command_category: 'general',
    action_type: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (command) {
      // If editing, populate with command data
      setEditedCommand({
        command_name: command.command_name || '',
        keywords: command.keywords?.join(', ') || '',
        response: command.response || '',
        command_category: command.command_category || 'general',
        action_type: command.action_type || ''
      });
    } else {
      // If creating new, set defaults
      setEditedCommand({
        command_name: '',
        keywords: '',
        response: '',
        command_category: 'general',
        action_type: ''
      });
    }
    setError('');
  }, [command, isOpen]);

  const isNewCommand = !command?.id;

  const handleChange = (field: keyof CommandFormData, value: string) => {
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
        command_name: editedCommand.command_name,
        command_category: editedCommand.command_category,
        keywords: editedCommand.keywords.split(',').map(k => k.trim()).filter(k => k),
        response: editedCommand.response,
        action_type: editedCommand.action_type || null
      };

      if (command?.id) {
        // Update existing command
        await VoiceCommand.update(command.id, finalCommand);
      } else {
        // Create new command
        await VoiceCommand.create(finalCommand);
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
          <DialogTitle>{isNewCommand ? 'Add New Command' : 'Edit Command'}</DialogTitle>
          <DialogDescription>
            Define how Ander understands, responds, and acts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="command_name">Command Name</Label>
            <Input 
              id="command_name" 
              value={editedCommand.command_name} 
              onChange={e => handleChange('command_name', e.target.value)} 
              placeholder="e.g., Movie Time" 
            />
          </div>
          <div>
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Textarea 
              id="keywords" 
              value={editedCommand.keywords} 
              onChange={e => handleChange('keywords', e.target.value)} 
              placeholder="e.g., let's watch a movie, start movie mode" 
            />
          </div>
          <div>
            <Label htmlFor="response">Ander's Response</Label>
            <Input 
              id="response" 
              value={editedCommand.response} 
              onChange={e => handleChange('response', e.target.value)} 
              placeholder="e.g., Okay, setting the mood for a movie." 
            />
          </div>
          <div>
            <Label htmlFor="command_category">Category</Label>
            <Input 
              id="command_category" 
              value={editedCommand.command_category} 
              onChange={e => handleChange('command_category', e.target.value)} 
              placeholder="e.g., lighting, entertainment" 
            />
          </div>
          <div>
            <Label htmlFor="action_type">Action Type (Optional)</Label>
            <Input 
              id="action_type" 
              value={editedCommand.action_type} 
              onChange={e => handleChange('action_type', e.target.value)} 
              placeholder="e.g., lights_all_on, system_check" 
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
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
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Command'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}