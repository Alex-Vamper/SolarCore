
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, CreditCard } from 'lucide-react';
import PaymentModal from './PaymentModal';

const plans = [
  {
    name: 'Free Plan',
    subtitle: 'Core Access',
    price: 'Free',
    features: [
      'Voice assistant for basic controls (lights, sockets, domes, appliances)',
      'Standard SolarCore app integration',
      'Alerts & notifications (fire, gas, rain, water tank)',
      'Limited voice command history (last 24h)',
      'Runs offline on local devices for critical safety',
    ],
    buttonText: 'Select Free Plan',
    planId: 'free',
    isPopular: false,
  },
  {
    name: 'Premium Plan',
    subtitle: 'Personalized Smart Living',
    price: '₦10,000/Month', // Price updated as per outline
    features: [
      'Everything in Free, plus:',
      'Custom Voice Packs (choose personality, accent, tone)',
      'Advanced Routines & Scheduling (Ander learns habits)',
      'Multi-language mode (English, Pidgin, Yoruba, Hausa, Igbo)',
      'AI Insights → predictive energy reports, optimization tips',
      'Voice Notes & Reminders stored in the app',
      'Cloud sync across multiple houses/locations',
    ],
    buttonText: 'Upgrade to Premium',
    planId: 'premium',
    isPopular: true,
  },
  {
    name: 'Enterprise Plan',
    subtitle: 'Institutions & Businesses',
    price: 'Custom Pricing',
    features: [
      'Multi-user voice authentication (staff/roles)',
      'Reports & Analytics → energy, safety, usage logs',
      'Integration with enterprise dashboards',
      'Priority support + SLA',
      'Hardware bundling with SolarCore kits',
    ],
    buttonText: 'Contact Sales',
    planId: 'enterprise',
    isPopular: false,
  },
];

export default function SubscriptionModal({ isOpen, onClose, onSelectPlan }) {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePlanSelect = async (planId) => {
    if (planId === 'premium') {
      setSelectedPlan(planId);
      setShowPayment(true);
    } else if (planId === 'enterprise') {
      // For enterprise, open mail client as per outline
      window.location.href = 'mailto:samuelalexander851@gmail.com?subject=Enterprise Plan Inquiry';
    } else if (planId === 'free') {
      // Handle free plan selection - update database
      try {
        const { UserSettings } = await import('@/entities/all');
        await UserSettings.upsert({ 
          subscription_plan: 'free',
          subscription_status: 'active'
        });
        // Notify other components that settings have changed
        window.dispatchEvent(new CustomEvent('anderSettingsChanged'));
      } catch (error) {
        console.error('Error updating subscription:', error);
      }
      onSelectPlan(planId);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    // Update user settings with premium subscription
    try {
      const { UserSettings } = await import('@/entities/all');
      await UserSettings.upsert({ 
        subscription_plan: 'premium',
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString()
      });
      // Notify other components that settings have changed
      window.dispatchEvent(new CustomEvent('anderSettingsChanged'));
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
    onSelectPlan('premium');
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
    setSelectedPlan(null);
  };

  if (showPayment) {
    return (
      <PaymentModal
        isOpen={showPayment}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
        plan="premium"
        amount={10000} // Amount updated as per outline
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold font-inter">Ander AI Pricing</DialogTitle>
          <DialogDescription className="text-lg text-gray-600 font-inter">
            Choose a plan to unlock the full potential of your smart home assistant.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col ${
                plan.isPopular ? 'border-yellow-500 border-2 shadow-xl relative' : 'border-gray-200'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3"/>
                    Most Popular
                  </div>
                </div>
              )}
              <CardHeader className="text-center pt-6">
                <CardTitle className="text-xl font-inter">{plan.name}</CardTitle>
                <p className="text-sm text-gray-600 font-inter">{plan.subtitle}</p>
                <p className="text-2xl font-bold text-gray-800 font-inter mt-2">{plan.price}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 font-inter">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  onClick={() => handlePlanSelect(plan.planId)}
                  className={`w-full font-inter text-white ${ // Added text-white here
                    plan.isPopular
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : plan.planId === 'free' // Updated logic for 'free' plan button
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : plan.planId === 'enterprise' // Updated logic for 'enterprise' plan button with gradient
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                      : 'bg-gray-600 hover:bg-gray-700' // Fallback, though all plans now have specific styles
                  }`}
                >
                  {plan.planId === 'premium' && <CreditCard className="w-4 h-4 mr-2" />}
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 font-inter">
            All plans include a 30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
