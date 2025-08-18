import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, Moon, AlertTriangle, Shield } from "lucide-react";

interface QuickActionsProps {
  onAction: (actionType: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      id: "lights_off",
      label: "Lights Off",
      icon: Lightbulb,
      color: "bg-yellow-500/20 text-yellow-600"
    },
    {
      id: "night_mode", 
      label: "Night Mode",
      icon: Moon,
      color: "bg-blue-500/20 text-blue-600"
    },
    {
      id: "fire_alert",
      label: "Fire Alert",
      icon: AlertTriangle,
      color: "bg-red-500/20 text-red-600"
    },
    {
      id: "security_mode",
      label: "Security",
      icon: Shield,
      color: "bg-green-500/20 text-green-600"
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 font-inter">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 bg-white hover:bg-gray-50"
            onClick={() => onAction(action.id)}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium font-inter">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}