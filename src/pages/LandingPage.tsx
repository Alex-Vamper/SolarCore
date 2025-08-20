import * as React from "react";

import { Button } from "@/components/ui/button";
import { Sun, Zap, Shield, Home } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-solarcore-yellow via-solarcore-orange to-solarcore-blue flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center text-white">
        <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
          <Sun className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4 font-inter">SolarCore</h1>
        <p className="text-xl mb-8 opacity-90 font-inter">Smart Home Control</p>
        
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold font-inter">Energy Management</p>
              <p className="text-sm opacity-80 font-inter">Monitor and optimize your energy usage</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold font-inter">Smart Automation</p>
              <p className="text-sm opacity-80 font-inter">Control your entire home from one place</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold font-inter">Safety First</p>
              <p className="text-sm opacity-80 font-inter">Advanced security and monitoring</p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={onGetStarted}
          className="w-full bg-white text-solarcore-blue hover:bg-gray-100 font-semibold py-3 rounded-xl transition-all duration-200"
          size="lg"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}