import * as React from "react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const faqs = [
    {
      question: "How do I set up my SolarCore system?",
      answer: "Setting up your SolarCore system is easy! Start by running the setup wizard from your dashboard. It will guide you through connecting your devices, configuring rooms, and setting up automation rules."
    },
    {
      question: "Why are my solar panels not generating power?",
      answer: "Check if there's any obstruction blocking sunlight from reaching your panels. Also ensure all connections are secure and the panels are clean. If the issue persists, contact our support team."
    },
    {
      question: "How do I add new devices to my system?",
      answer: "Go to the Automation page, select the room where you want to add the device, and click 'Add Device'. Follow the pairing instructions for your specific device type."
    },
    {
      question: "What should I do if a safety alert is triggered?",
      answer: "Safety alerts require immediate attention. Check the Safety page for detailed information about the alert. For fire-related alerts, evacuate immediately and contact emergency services."
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 font-inter">Frequently Asked Questions</h1>
        </div>
        <p className="text-gray-600 font-inter">
          Find answers to common questions about your SolarCore smart home system
        </p>
      </div>

      <Card className="glass-card border-0 shadow-lg">
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 last:border-0">
                <AccordionTrigger className="text-left font-semibold text-gray-900 font-inter hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 font-inter">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}