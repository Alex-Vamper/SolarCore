import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'pro'>('basic');

  const plans = [
    {
      id: 'basic' as const,
      name: 'Basic',
      price: 'Free',
      icon: <Star className="w-5 h-5" />,
      features: [
        'Basic voice commands',
        'Standard responses',
        '5 custom commands',
        'Email support'
      ],
      color: 'bg-gray-500',
      current: true
    },
    {
      id: 'premium' as const,
      name: 'Premium',
      price: '$9.99/month',
      icon: <Crown className="w-5 h-5" />,
      features: [
        'Advanced voice commands',
        'Custom voice responses',
        'Unlimited custom commands',
        'Audio upload capability',
        'Priority support'
      ],
      color: 'bg-blue-600',
      current: false
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '$19.99/month',
      icon: <Zap className="w-5 h-5" />,
      features: [
        'Everything in Premium',
        'AI-powered responses',
        'Multi-language support',
        'Advanced automation',
        'Phone support'
      ],
      color: 'bg-purple-600',
      current: false
    }
  ];

  const handleUpgrade = () => {
    // TODO: Implement payment processing
    console.log(`Upgrading to ${selectedPlan} plan`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Ander Plan
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${plan.current ? 'border-green-500' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <div className={`p-2 rounded-full ${plan.color} text-white`}>
                    {plan.icon}
                  </div>
                  {plan.current && (
                    <Badge className="bg-green-500 text-white">Current</Badge>
                  )}
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-2xl font-bold text-blue-600">{plan.price}</div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedPlan !== 'basic' && (
            <Button onClick={handleUpgrade} className="bg-blue-600 hover:bg-blue-700">
              Upgrade to {plans.find(p => p.id === selectedPlan)?.name}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}