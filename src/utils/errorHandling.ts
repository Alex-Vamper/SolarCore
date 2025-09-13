import { toast } from 'sonner';

export interface ErrorWithRetry {
  message: string;
  retryAction?: () => Promise<void>;
  code?: string;
}

export const handleError = (error: unknown, context?: string, retryAction?: () => Promise<void>) => {
  let errorMessage = 'An unknown error occurred';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  console.error(`Error in ${context || 'unknown context'}:`, error);

  const toastOptions: any = {
    description: context ? `Context: ${context}` : undefined,
    duration: 5000,
  };

  if (retryAction) {
    toastOptions.action = {
      label: 'Retry',
      onClick: retryAction
    };
  }

  toast.error(errorMessage, toastOptions);
};

export const handleSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 3000,
  });
};

export const handleWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 4000,
  });
};

export const handleInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 3000,
  });
};