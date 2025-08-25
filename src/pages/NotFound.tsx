import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="glass-card border-0 shadow-lg max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="text-8xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 font-inter mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 font-inter mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 shadow-lg transition-all duration-300 hover:scale-105 font-inter"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full border-gray-300 hover:bg-gray-50 font-inter"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
