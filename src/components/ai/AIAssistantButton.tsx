import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function AIAssistantButton() {
  return (
    <Button
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full shadow-lg gradient-solarcore hover:scale-105 transition-transform z-30"
      size="icon"
      onClick={() => {
        // TODO: Implement AI assistant
        console.log("AI Assistant clicked");
      }}
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </Button>
  );
}