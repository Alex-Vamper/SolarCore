import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Users, Lightbulb } from "lucide-react";

interface RoomBoxProps {
  room: any;
}

export default function RoomBox({ room }: RoomBoxProps) {
  return (
    <Card className="p-4 glass-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-gray-900 font-inter">{room.name}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className="font-inter">{room.occupancy_status ? 'Occupied' : 'Empty'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                <span className="font-inter">{room.appliances?.length || 0} devices</span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="font-inter">
          Control
        </Button>
      </div>
    </Card>
  );
}