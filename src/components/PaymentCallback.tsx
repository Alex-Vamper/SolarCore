import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
  
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference && !trxref) {
        setStatus('failed');
        return;
      }

      try {
        // Give a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if user subscription was updated
        const { UserSettings } = await import('@/entities/all');
        const settings = await UserSettings.list();
        
        if (settings.length > 0 && settings[0].subscription_plan === 'premium') {
          setStatus('success');
          // Notify other components that settings have changed
          window.dispatchEvent(new CustomEvent('anderSettingsChanged'));
        } else {
          // Wait a bit more and try again
          await new Promise(resolve => setTimeout(resolve, 3000));
          const updatedSettings = await UserSettings.list();
          
          if (updatedSettings.length > 0 && updatedSettings[0].subscription_plan === 'premium') {
            setStatus('success');
            window.dispatchEvent(new CustomEvent('anderSettingsChanged'));
          } else {
            setStatus('failed');
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [reference, trxref]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const handleRetry = () => {
    navigate('/settings');
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Welcome to Ander AI Premium! Your subscription is now active.
            </p>
            <div className="p-4 bg-green-50 rounded-lg mb-6">
              <p className="text-sm text-green-700">
                You now have access to all Premium features including custom voice packs, 
                advanced routines, and multi-language support.
              </p>
            </div>
            <Button onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-700">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            We couldn't verify your payment. Please try again or contact support if the issue persists.
          </p>
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/help')} 
              variant="outline" 
              className="w-full"
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}