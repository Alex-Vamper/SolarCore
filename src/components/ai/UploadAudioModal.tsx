import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Play, Pause, Trash2, Mic, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UploadAudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandId?: string;
}

export default function UploadAudioModal({ 
  open, 
  onOpenChange, 
  commandId 
}: UploadAudioModalProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(file));
        setError("");
      } else {
        setError("Please select a valid audio file");
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const file = new File([blob], 'recorded-audio.wav', { type: 'audio/wav' });
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError("");
    } catch (error) {
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const removeAudio = () => {
    setAudioFile(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!audioFile) {
      setError("Please select or record an audio file");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Upload to ander-tts bucket
      const fileName = `${user.id}/${Date.now()}-${audioFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ander-tts')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // Save to voice_response_audios table
      const { error: dbError } = await supabase
        .from('voice_response_audios')
        .insert({
          user_id: user.id,
          command_id: commandId,
          storage_path: uploadData.path,
          transcript: `Custom audio for command ${commandId}`,
          format: audioFile.type.split('/')[1] || 'wav'
        });

      if (dbError) throw dbError;

      onOpenChange(false);
      removeAudio();
    } catch (error: any) {
      setError(error.message || "Failed to upload audio");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    removeAudio();
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Upload Custom Audio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert>
            <AlertDescription>
              Upload or record a custom audio response for voice commands.
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="audio-file">Select Audio File</Label>
            <Input
              ref={fileInputRef}
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
          </div>

          {/* Recording */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center gap-2"
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Record Audio
                </>
              )}
            </Button>
            {isRecording && (
              <div className="flex items-center gap-1 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording...
              </div>
            )}
          </div>

          {/* Audio Preview */}
          {audioFile && audioUrl && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{audioFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeAudio}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={togglePlayback}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!audioFile || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? "Uploading..." : "Upload Audio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}