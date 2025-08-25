import * as React from "react";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, MessageSquare, ThumbsUp } from 'lucide-react';
import Layout from '@/layouts/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

export default function Feedback() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: "",
    category: "",
    feedback: "",
    suggestion: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback! We appreciate your input and will use it to improve SolarCore.",
    });
    
    setFormData({
      name: "",
      email: "",
      rating: "",
      category: "",
      feedback: "",
      suggestion: ""
    });
    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 font-inter">Share Your Feedback</h1>
          </div>
          <p className="text-gray-600 font-inter">
            Help us improve SolarCore by sharing your thoughts and suggestions
          </p>
        </div>

        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-inter">
              <ThumbsUp className="w-5 h-5 text-primary" />
              Feedback Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="font-inter">Full Name (Optional)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="font-inter"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="font-inter">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="font-inter"
                  />
                </div>
              </div>

              <div>
                <Label className="font-inter mb-3 block">Overall Rating</Label>
                <RadioGroup 
                  value={formData.rating} 
                  onValueChange={(value) => handleInputChange("rating", value)}
                  className="flex items-center gap-4"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                      <Label htmlFor={`rating-${rating}`} className="flex items-center gap-1 cursor-pointer">
                        <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                        <span className="font-inter">{rating}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="font-inter mb-3 block">Feedback Category</Label>
                <RadioGroup 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange("category", value)}
                  className="grid md:grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="usability" id="usability" />
                    <Label htmlFor="usability" className="font-inter">Usability & Interface</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="features" id="features" />
                    <Label htmlFor="features" className="font-inter">Features & Functionality</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="performance" id="performance" />
                    <Label htmlFor="performance" className="font-inter">Performance & Speed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="support" id="support" />
                    <Label htmlFor="support" className="font-inter">Support & Documentation</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="feedback" className="font-inter">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => handleInputChange("feedback", e.target.value)}
                  rows={5}
                  required
                  className="font-inter"
                  placeholder="Tell us about your experience with SolarCore..."
                />
              </div>

              <div>
                <Label htmlFor="suggestion" className="font-inter">Suggestions for Improvement</Label>
                <Textarea
                  id="suggestion"
                  value={formData.suggestion}
                  onChange={(e) => handleInputChange("suggestion", e.target.value)}
                  rows={4}
                  className="font-inter"
                  placeholder="How can we make SolarCore better?"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 font-inter"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg mt-6">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 font-inter mb-2">
              Thank You!
            </h3>
            <p className="text-gray-600 font-inter">
              Your feedback is valuable to us and helps make SolarCore better for everyone. 
              We review all feedback and use it to guide our future development.
            </p>
          </CardContent>
        </Card>
      </div>
  );
}