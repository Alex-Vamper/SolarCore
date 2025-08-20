import * as React from "react";

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="p-4 space-y-6">
      <Link to={createPageUrl("Settings")}>
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>
      </Link>
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-900 font-inter">Privacy Policy</h1>
        <p className="text-gray-600 font-inter mt-1">
          How we handle your data
        </p>
      </div>
      <div className="text-center py-20">
        <p className="text-gray-500 font-inter">Privacy Policy content coming soon.</p>
      </div>
    </div>
  );
}