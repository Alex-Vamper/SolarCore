import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Mic, Globe, Target } from 'lucide-react';

interface SubscriptionFeatureInfoProps {
  subscriptionPlan: string;
  onUpgrade: () => void;
}

export default function SubscriptionFeatureInfo({ 
  subscriptionPlan, 
  onUpgrade 
}: SubscriptionFeatureInfoProps) {
  const isPremium = subscriptionPlan === 'premium' || subscriptionPlan === 'enterprise';

  return (
    <Card className={`border-2 ${isPremium ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown className={`w-5 h-5 ${isPremium ? 'text-green-600' : 'text-yellow-600'}`} />
          Voice Command Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPremium ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-300">Premium Active</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Mic className="w-4 h-4" />
                <span>High-quality pre-recorded audio responses</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Globe className="w-4 h-4" />
                <span>Multi-language voice responses (5 languages)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Target className="w-4 h-4" />
                <span>Specific device commands (ceiling lights, TV socket, etc.)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Free Plan</Badge>
            </div>
            <div className="text-sm text-yellow-800 space-y-2">
              <p className="font-medium">Current Features:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Text-to-speech responses</li>
                <li>Global commands (turn on/off all devices)</li>
                <li>Room-level commands (living room lights, bedroom AC, etc.)</li>
              </ul>
            </div>
            <div className="text-sm text-yellow-800 space-y-2">
              <p className="font-medium">Upgrade to Premium for:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>High-quality pre-recorded audio responses</li>
                <li>Multi-language support (English, Hausa, Yoruba, Igbo, Pidgin)</li>
                <li>Specific device commands ("turn off ceiling lights", "turn on TV socket")</li>
              </ul>
            </div>
            <Button 
              onClick={onUpgrade}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}