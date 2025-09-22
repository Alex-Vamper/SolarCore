import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  isPremium: boolean;
}

export default function LanguageSelector({ 
  selectedLanguage, 
  onLanguageChange, 
  isPremium 
}: LanguageSelectorProps) {
  const languages = [
    { value: 'english', label: 'English', flag: '🇬🇧' },
    { value: 'hausa', label: 'Hausa', flag: '🇳🇬' },
    { value: 'yoruba', label: 'Yoruba', flag: '🇳🇬' },
    { value: 'igbo', label: 'Igbo', flag: '🇳🇬' },
    { value: 'pidgin', label: 'Nigerian Pidgin', flag: '🇳🇬' }
  ];

  if (!isPremium) {
    return null; // Don't show for free users
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5 text-primary" />
          Voice Response Language
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language-select" className="text-sm font-medium text-muted-foreground">
            Choose your preferred language for Ander's voice responses
          </Label>
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger id="language-select" className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value} className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">Premium Feature</p>
          <p>Multi-language voice responses are available exclusively for Premium subscribers. Ander will use pre-recorded audio in your selected language when available, with English fallback.</p>
        </div>
      </CardContent>
    </Card>
  );
}