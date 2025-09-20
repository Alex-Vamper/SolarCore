import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [paymentData, setPaymentData] = useState({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!paymentData.email || !paymentData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    if (!paymentData.expiryDate || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(paymentData.expiryDate)) {
      newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
    }
    
    if (!paymentData.cvv || paymentData.cvv.length !== 3) {
      newErrors.cvv = 'Please enter a valid 3-digit CVV';
    }
    
    if (!paymentData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter the cardholder name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    
    setStep('processing');
    
    try {
      // Create transaction with backend
      const { data, error } = await supabase.functions.invoke('create-transaction', {
        body: { plan: 'premium' }
      });

      if (error) {
        console.error('Error creating transaction:', error);
        alert('Failed to initialize payment. Please try again.');
        setStep('payment');
        return;
      }

      if (data.success && data.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else {
        console.error('Invalid response from payment service');
        alert('Failed to initialize payment. Please try again.');
        setStep('payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setStep('payment');
    }
  };

  const handleSuccess = () => {
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setStep('payment');
    setPaymentData({
      email: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    });
    setErrors({});
    onClose();
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
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

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-inter">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="font-inter">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={paymentData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`mt-1 font-inter ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1 font-inter">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="cardholderName" className="font-inter">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  value={paymentData.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                  className={`mt-1 font-inter ${errors.cardholderName ? 'border-red-500' : ''}`}
                />
                {errors.cardholderName && <p className="text-sm text-red-500 mt-1 font-inter">{errors.cardholderName}</p>}
              </div>

              <div>
                <Label htmlFor="cardNumber" className="font-inter">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={paymentData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                  maxLength={19}
                  className={`mt-1 font-inter ${errors.cardNumber ? 'border-red-500' : ''}`}
                />
                {errors.cardNumber && <p className="text-sm text-red-500 mt-1 font-inter">{errors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate" className="font-inter">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={paymentData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                    maxLength={5}
                    className={`mt-1 font-inter ${errors.expiryDate ? 'border-red-500' : ''}`}
                  />
                  {errors.expiryDate && <p className="text-sm text-red-500 mt-1 font-inter">{errors.expiryDate}</p>}
                </div>
                <div>
                  <Label htmlFor="cvv" className="font-inter">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={paymentData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                    maxLength={3}
                    className={`mt-1 font-inter ${errors.cvv ? 'border-red-500' : ''}`}
                  />
                  {errors.cvv && <p className="text-sm text-red-500 mt-1 font-inter">{errors.cvv}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Lock className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-600 font-inter">
                  Your payment information is encrypted and secure
                </p>
              </div>

              <Button 
                onClick={handlePayment}
                className="w-full bg-blue-600 hover:bg-blue-700 font-inter text-lg py-3"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay ₦{amount}
              </Button>
            </CardContent>
          </Card>

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
