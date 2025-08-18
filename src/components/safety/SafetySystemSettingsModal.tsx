import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SafetySystemSettingsModal({ isOpen, onClose, system, onSave, onDelete }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Safety System Settings</DialogTitle>
        </DialogHeader>
        <p>Safety system settings modal - placeholder</p>
      </DialogContent>
    </Dialog>
  );
}