import React from "react";
import { Card } from "@/components/ui/card";
import { Shield, CheckCircle, AlertCircle, Camera, Flame } from "lucide-react";

interface SafetyStatusProps {
  safetyData: any[];
}

export default function SafetyStatus({ safetyData }: SafetyStatusProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'smoke_detector': return Flame;
      case 'security_camera': return Camera;
      default: return Shield;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 font-inter">Safety Status</h2>
      
      {safetyData.length === 0 ? (
        <Card className="p-4 text-center">
          <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-inter">No safety systems configured</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {safetyData.map((system) => {
            const IconComponent = getIcon(system.type);
            return (
              <Card key={system.id} className="p-4 glass-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 font-inter capitalize">
                        {system.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600 font-inter">{system.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {system.status === 'online' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium font-inter ${getStatusColor(system.status)}`}>
                      {system.status}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}