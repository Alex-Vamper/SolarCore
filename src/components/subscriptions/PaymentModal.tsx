import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Lock, 
  ArrowLeft,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentModal({ isOpen, onClose, onSuccess, plan, amount }) {
  const [step, setStep] = useState('payment'); // 'payment', 'processing', 'success'

  const handlePayment = async () => {
    console.log('Starting payment process...');
    setStep('processing');
    
    try {
      console.log('Invoking create-transaction function...');
      // Create transaction with backend
      const { data, error } = await supabase.functions.invoke('create-transaction', {
        body: { plan: 'premium' }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Error creating transaction:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert(`Failed to initialize payment: ${error.message || 'Please try again.'}`);
        setStep('payment');
        return;
      }

      if (data?.success && data?.authorization_url) {
        console.log('Payment URL received, redirecting to:', data.authorization_url);
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else {
        console.error('Invalid response from payment service:', data);
        alert('Failed to initialize payment. Please try again.');
        setStep('payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error stack:', error.stack);
      alert(`Payment failed: ${error.message || 'Please try again.'}`);
      setStep('payment');
    }
  };

  const handleSuccess = () => {
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setStep('payment');
    onClose();
  };

  if (step === 'processing') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold font-inter mb-2">Processing Payment</h2>
            <p className="text-gray-600 font-inter">Please wait while we process your payment...</p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-inter">
                <Lock className="w-4 h-4 inline mr-2" />
                Your payment is secure and encrypted
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold font-inter mb-2">Payment Successful!</h2>
            <p className="text-gray-600 font-inter mb-4">
              Welcome to Ander AI Premium! Your subscription is now active.
            </p>
            <div className="p-4 bg-green-50 rounded-lg mb-6">
              <p className="text-sm text-green-700 font-inter">
                You now have access to all Premium features including custom voice packs, 
                advanced routines, and multi-language support.
              </p>
            </div>
            <Button onClick={handleSuccess} className="w-full bg-green-600 hover:bg-green-700 font-inter">
              Get Started with Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle className="text-xl font-inter">Complete Your Payment</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold font-inter">Ander AI Premium</h3>
                  <p className="text-sm text-gray-600 font-inter">Monthly subscription</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 font-inter">₦{amount}</div>
                  <div className="text-sm text-gray-500 font-inter">per month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Button 
            onClick={handlePayment}
            className="w-full bg-blue-600 hover:bg-blue-700 font-inter text-lg py-3"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay ₦{amount}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500 font-inter">
              By completing this payment, you agree to our Terms of Service and Privacy Policy.
              You can cancel your subscription anytime.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}