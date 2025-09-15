import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Shield, Flame, Droplets, Wind, Eye } from "lucide-react";

interface SystemStatus {
  id: string;
  name: string;
  type: string;
  status: 'optimal' | 'warning' | 'error';
  details: string;
  room?: string;
}

interface SystemsCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  systems: SystemStatus[];
}

export default function SystemsCheckModal({ isOpen, onClose, systems }: SystemsCheckModalProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSystemIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'fire_detection': return <Flame className="w-5 h-5 text-red-500" />;
      case 'gas_leak': return <Wind className="w-5 h-5 text-orange-500" />;
      case 'rain_detection': return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'window_rain': return <Eye className="w-5 h-5 text-purple-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'optimal': return <Badge className="bg-green-100 text-green-800 border-green-200">Optimal</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="app-heading flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            System Status Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {systems.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="app-text font-semibold text-gray-900 mb-2">No Systems Found</h3>
                <p className="app-text text-gray-600">
                  No safety or security systems are currently configured.
                </p>
                <p className="app-text text-sm text-gray-500 mt-2">
                  Visit the Safety page to add devices or purchase new ones from{" "}
                  <a 
                    href="https://solar-core-powered-living.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    our store
                  </a>.
                </p>
              </CardContent>
            </Card>
          ) : (
            systems.map((system) => (
              <Card key={system.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getSystemIcon(system.type)}
                      <div>
                        <h3 className="app-text font-semibold text-gray-900">{system.name}</h3>
                        {system.room && (
                          <p className="app-text text-sm text-gray-500">{system.room}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(system.status)}
                      {getStatusBadge(system.status)}
                    </div>
                  </div>
                  <p className="app-text text-gray-600 text-sm">{system.details}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}