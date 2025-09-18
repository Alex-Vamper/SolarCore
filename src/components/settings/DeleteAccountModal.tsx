import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function DeleteAccountModal({ isOpen, onClose, user }: DeleteAccountModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleInitialDelete = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirmDialog(false);
    setShowFinalDialog(true);
  };

  const handleFinalDelete = async () => {
    if (confirmationText !== "Delete My Account") {
      toast({
        title: "Invalid confirmation",
        description: "Please type 'Delete My Account' exactly as shown.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Call edge function to delete account and all related data
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user.id }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = "/";
      
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetModal = () => {
    setShowConfirmDialog(false);
    setShowFinalDialog(false);
    setConfirmationText("");
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showConfirmDialog && !showFinalDialog} onOpenChange={resetModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action will permanently delete your account and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your user account and profile</li>
                <li>• All rooms and automation settings</li>
                <li>• All safety systems and configurations</li>
                <li>• All voice commands and Ander settings</li>
                <li>• All energy systems and power configurations</li>
                <li>• All WiFi networks and device connections</li>
                <li>• All subscription data and billing information</li>
                <li>• Everything associated with your account</li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-600">
              This action is irreversible. All your data will be permanently lost.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetModal}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleInitialDelete}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data. 
              This action cannot be undone and your data cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, I understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showFinalDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Final Confirmation</DialogTitle>
            <DialogDescription>
              To confirm deletion, please type <strong>"Delete My Account"</strong> in the field below:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="confirmation">Type "Delete My Account"</Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Delete My Account"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowFinalDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleFinalDelete}
              disabled={confirmationText !== "Delete My Account" || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete My Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}