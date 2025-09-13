import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Shield,
  Clock 
} from 'lucide-react';

interface SafetySystemStatusBadgeProps {
  status: string;
  lastTriggered?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig = {
  safe: {
    variant: 'secondary' as const,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    icon: CheckCircle,
    text: 'Safe'
  },
  alert: {
    variant: 'secondary' as const,
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: AlertTriangle,
    text: 'Alert'
  },
  active: {
    variant: 'destructive' as const,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200', 
    icon: Activity,
    text: 'Active'
  },
  suppression_active: {
    variant: 'secondary' as const,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    icon: Shield,
    text: 'Suppression Active'
  },
  unknown: {
    variant: 'outline' as const,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: Clock,
    text: 'Unknown'
  }
};

export const SafetySystemStatusBadge: React.FC<SafetySystemStatusBadgeProps> = ({
  status,
  lastTriggered,
  size = 'md',
  showIcon = true
}) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge 
        variant={config.variant}
        className={`${config.bgColor} ${config.color} ${sizeClasses[size]} flex items-center gap-1.5 font-medium`}
      >
        {showIcon && <Icon className={iconSizes[size]} />}
        {config.text}
      </Badge>
      {lastTriggered && (
        <span className="text-xs text-muted-foreground">
          Last: {new Date(lastTriggered).toLocaleString()}
        </span>
      )}
    </div>
  );
};