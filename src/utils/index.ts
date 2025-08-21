// SolarCore Utils

export const createPageUrl = (pageName: string): string => {
  const pageRoutes: Record<string, string> = {
    Dashboard: "/",
    Automation: "/automation",
    Energy: "/energy", 
    Safety: "/safety",
    Settings: "/settings",
    Notifications: "/notifications",
    LandingPage: "/landing",
    FAQ: "/faq",
    ContactSupport: "/contact-support",
    Feedback: "/feedback",
    HelpCenter: "/help",
    PrivacyPolicy: "/privacy",
    Ander: "/ander"
  };

  return pageRoutes[pageName] || "/";
};

export const formatEnergy = (value: number, unit: string = "kWh"): string => {
  return `${value.toFixed(2)} ${unit}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};