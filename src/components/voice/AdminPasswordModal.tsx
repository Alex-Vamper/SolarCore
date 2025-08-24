import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminPasswordModal({ isOpen, onClose, onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');

    // Frontend-only password validation
    setTimeout(() => {
      if (password === 'Alex-Ander-1.05') {
        onAuthenticated();
        onClose();
        setPassword('');
      } else {
        setError('Invalid admin password. Please try again.');
      }
      setIsValidating(false);
    }, 800); // Small delay to simulate validation
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setIsValidating(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-inter text-center">
            <Lock className="w-5 h-5 text-red-600" />
            Admin Access Required
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="adminPassword" className="font-inter">Enter Admin Password</Label>
            <div className="relative">
              <Input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-2 pr-10 font-inter"
                disabled={isValidating}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isValidating}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-inter">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isValidating}
              className="flex-1 font-inter"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!password || isValidating}
              className="flex-1 bg-red-600 hover:bg-red-700 font-inter"
            >
              {isValidating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Authenticate
            </Button>
          </div>
        </form>

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 text-center font-inter">
            This mode allows uploading audio responses for voice commands.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}