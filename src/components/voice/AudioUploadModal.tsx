
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, Volume2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VoiceCommand } from '@/entities/all';

export default function AudioUploadModal({ isOpen, onClose, command }) {
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    if (command) {
      setAudioUrl(command.audio_url || '');
      setUploadStatus(null);
      setSelectedFile(null);
      setActiveTab('upload');
    }
  }, [command]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        setUploadStatus({ type: 'error', message: 'Please select an audio file.' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadStatus({ type: 'error', message: 'File size must be less than 5MB.' });
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Please select a file first.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: 'info', message: 'Processing audio upload...' });

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('commandId', command?.id || '');
      formData.append('isAdmin', 'true');
      formData.append('adminPassword', 'Alex-Ander-1.05');
      
      const { data, error } = await supabase.functions.invoke('process-audio-upload', {
        body: formData
      });
      
      if (error) throw error;
      
      if (data.success) {
        setAudioUrl(data.audioUrl);
        setUploadStatus({ type: 'success', message: data.message || 'Audio uploaded and propagated globally!' });
        setActiveTab('url');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ type: 'error', message: `Upload failed: ${error.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!audioUrl.trim()) {
      setUploadStatus({ type: 'error', message: 'Please provide an audio URL.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: 'info', message: 'Saving audio URL...' });

    try {
      await VoiceCommand.update(command.id, { audio_url: audioUrl });
      setUploadStatus({ type: 'success', message: 'Audio URL saved successfully!' });
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Save error:', error);
      setUploadStatus({ type: 'error', message: 'Failed to save audio URL. Please try again.' });
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    setUploadStatus({ type: 'info', message: 'Removing audio...' });

    try {
      await VoiceCommand.update(command.id, { audio_url: null });
      setAudioUrl('');
      setUploadStatus({ type: 'success', message: 'Audio removed successfully!' });
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Remove error:', error);
      setUploadStatus({ type: 'error', message: 'Failed to remove audio. Please try again.' });
      setIsUploading(false);
    }
  };

  const testAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        setUploadStatus({ type: 'error', message: 'Failed to play audio. Please check the URL.' });
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-inter">
            <Volume2 className="w-5 h-5 text-green-600" />
            Audio Response for "{command?.command_name?.replace(/_/g, ' ')}"
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-1">
              <Link className="w-4 h-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label htmlFor="audioFile" className="font-inter">Select Audio File</Label>
              <input
                id="audioFile"
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1 font-inter">
                Supported: MP3, WAV, OGG (Max 5MB)
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium font-inter">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 font-inter">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 font-inter"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload Audio
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div>
              <Label htmlFor="audioUrl" className="font-inter">Audio File URL</Label>
              <Input
                id="audioUrl"
                type="url"
                placeholder="https://example.com/audio.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="mt-2 font-inter"
              />
              <p className="text-xs text-gray-500 mt-1 font-inter">
                Direct link to an audio file (MP3, WAV, OGG)
              </p>
            </div>

            {audioUrl && (
              <Button
                onClick={testAudio}
                variant="outline"
                className="w-full font-inter"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Test Audio
              </Button>
            )}
          </TabsContent>
        </Tabs>

        {uploadStatus && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            uploadStatus.type === 'success' ? 'bg-green-50 text-green-800' :
            uploadStatus.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : uploadStatus.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span className="text-sm font-inter">{uploadStatus.message}</span>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 font-inter"
          >
            Cancel
          </Button>
          
          {command?.audio_url && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isUploading}
              className="font-inter"
            >
              Remove Audio
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={!audioUrl.trim() || isUploading}
            className="flex-1 bg-green-600 hover:bg-green-700 font-inter"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
