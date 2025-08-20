import * as React from "react";

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: Eye,
      title: "Information We Collect",
      content: [
        "Account information (name, email, contact details)",
        "Device usage data and energy consumption patterns",
        "Home automation preferences and settings",
        "Safety and security system data",
        "Technical data for system performance optimization"
      ]
    },
    {
      icon: Database,
      title: "How We Use Your Information",
      content: [
        "Provide and maintain your SolarCore smart home services",
        "Monitor system performance and energy efficiency",
        "Send safety alerts and system notifications",
        "Improve our products and develop new features",
        "Provide customer support and technical assistance"
      ]
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        "End-to-end encryption for all data transmission",
        "Secure cloud storage with industry-standard protection",
        "Regular security audits and vulnerability assessments",
        "Multi-factor authentication for account access",
        "Limited access controls for our technical staff"
      ]
    },
    {
      icon: Users,
      title: "Information Sharing",
      content: [
        "We do not sell your personal data to third parties",
        "Emergency services may access safety data in crisis situations",
        "Aggregated, anonymized data may be used for research",
        "Service providers may process data under strict agreements",
        "Legal compliance may require limited data disclosure"
      ]
    }
  ];

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 font-inter">Privacy Policy</h1>
          </div>
          <p className="text-gray-600 font-inter">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="glass-card border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-inter">
              <FileText className="w-5 h-5 text-primary" />
              Our Commitment to Your Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 font-inter">
              At SolarCore, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our smart home platform 
              and services. We believe in transparency and want you to understand exactly how your information is handled.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={index} className="glass-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 font-inter">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3 text-gray-600 font-inter">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card border-0 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="font-inter">Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 font-inter mb-2">Access and Control</h3>
              <p className="text-gray-600 font-inter text-sm">
                You have the right to access, update, or delete your personal information at any time through your account settings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 font-inter mb-2">Data Portability</h3>
              <p className="text-gray-600 font-inter text-sm">
                You can request a copy of your data in a portable format if you wish to move to another service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 font-inter mb-2">Opt-Out Options</h3>
              <p className="text-gray-600 font-inter text-sm">
                You can opt out of non-essential data collection and marketing communications at any time.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg mt-6">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 font-inter mb-2">
              Questions About This Policy?
            </h3>
            <p className="text-gray-600 font-inter mb-4">
              If you have any questions about our privacy practices, please don't hesitate to contact us.
            </p>
            <a 
              href="/contact-support" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-inter"
            >
              Contact Us
            </a>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}