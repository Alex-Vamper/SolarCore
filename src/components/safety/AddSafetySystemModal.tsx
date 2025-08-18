import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AddSafetySystemModal({ isOpen, onClose, onSave, rooms }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Safety System</DialogTitle>
        </DialogHeader>
        <p>Add safety system modal - placeholder</p>
      </DialogContent>
    </Dialog>
  );
}