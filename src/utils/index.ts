// SolarCore Utils

export const createPageUrl = (pageName: string): string => {
  const pageRoutes: Record<string, string> = {
    Dashboard: "/app",
    Automation: "/app/automation",
    Energy: "/app/energy", 
    Safety: "/app/safety",
    Settings: "/app/settings",
    Notifications: "/app/notifications",
    LandingPage: "/"
  };

  return pageRoutes[pageName] || "/app";
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