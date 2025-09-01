import * as React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail,
  ArrowRight,
  ArrowLeft,
  HelpCircle
} from "lucide-react";
import Layout from '@/layouts/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HelpCenter() {
  const navigate = useNavigate();

  const helpOptions = [
    {
      icon: BookOpen,
      title: "FAQ",
      description: "Find answers to frequently asked questions",
      action: () => navigate("/faq"),
      color: "bg-blue-500"
    },
    {
      icon: MessageCircle,
      title: "Contact Support",
      description: "Get in touch with our support team",
      action: () => navigate("/contact"),
      color: "bg-green-500"
    },
    {
      icon: Mail,
      title: "Send Feedback",
      description: "Share your thoughts and suggestions",
      action: () => navigate("/feedback"),
      color: "bg-purple-500"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our team",
      action: () => window.open("tel:+234-xxx-xxx-xxxx"),
      color: "bg-orange-500"
    }
  ];

  return (
      <div className="p-4 pb-24">
        <div className="max-w-[1280px] mx-auto space-y-6">
          <Link to={createPageUrl('Settings')}>
            <Button variant="outline" className="font-inter">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 font-inter mb-2">Help Center</h1>
            <p className="text-gray-600 font-inter">
              Get the help you need with your SolarCore smart home system
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {helpOptions.map((option, index) => (
              <Card key={index} className="glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer" onClick={option.action}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${option.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <option.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 font-inter mb-2">
                        {option.title}
                      </h3>
                      <p className="text-gray-600 font-inter text-sm mb-3">
                        {option.description}
                      </p>
                      <Button variant="ghost" size="sm" className="p-0 h-auto text-primary hover:text-primary-foreground">
                        Learn more <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Help Section */}
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-inter">
                <HelpCircle className="w-5 h-5 text-primary" />
                Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 font-inter mb-2">Getting Started</h3>
                <p className="text-gray-600 font-inter text-sm">
                  New to SolarCore? Start with our setup wizard to configure your smart home devices and get everything connected.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 font-inter mb-2">Troubleshooting</h3>
                <p className="text-gray-600 font-inter text-sm">
                  If you're experiencing issues with your devices, try restarting them or check our troubleshooting guide in the FAQ section.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 font-inter mb-2">Emergency Support</h3>
                <p className="text-gray-600 font-inter text-sm">
                  For urgent safety-related issues, contact our 24/7 emergency support line immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}