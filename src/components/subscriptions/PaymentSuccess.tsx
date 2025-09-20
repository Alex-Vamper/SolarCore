import React, { useEffect } from 'react';
import { UserSettings } from '@/entities/all';
import { toast } from 'sonner';

interface PaymentSuccessProps {
  onSuccess?: () => void;
}

export default function PaymentSuccess({ onSuccess }: PaymentSuccessProps) {
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // Reload user settings to get updated subscription status
        const settings = await UserSettings.list();
        
        if (settings.length > 0 && settings[0].subscription_plan === 'premium') {
          console.log('Premium subscription activated, dispatching subscription change event');
          
          // Dispatch subscription change event to update voice processor
          window.dispatchEvent(new CustomEvent('subscriptionChanged', {
            detail: { 
              plan: 'premium',
              settings: settings[0]
            }
          }));
          
          toast.success('Premium features activated!', {
            description: 'Your Under AI will now use high-quality pre-recorded audio responses.'
          });
          
          onSuccess?.();
        }
      } catch (error) {
        console.error('Error handling payment success:', error);
      }
    };

    // Handle payment success from URL params or other triggers
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      handlePaymentSuccess();
    }

    // Listen for manual payment success triggers
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    
    return () => {
      window.removeEventListener('paymentSuccess', handlePaymentSuccess);
    };
  }, [onSuccess]);

  return null;
}