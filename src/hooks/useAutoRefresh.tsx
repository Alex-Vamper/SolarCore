import { useEffect, useCallback } from 'react';

export const useAutoRefresh = (refreshCallback: () => void, eventNames: string[] = []) => {
  const handleRefresh = useCallback((event?: any) => {
    // Add a longer delay to ensure backend updates are complete before refreshing
    setTimeout(() => {
      refreshCallback();
    }, 2000);
  }, [refreshCallback]);

  useEffect(() => {
    // Default events that should trigger refresh
    const defaultEvents = [
      'systemStateChanged',
      'deviceStateChanged', 
      'roomStateChanged',
      'applianceStateChanged',
      'safetyStateChanged'
    ];

    const allEvents = [...defaultEvents, ...eventNames];

    // Add listeners for all specified events
    allEvents.forEach(eventName => {
      window.addEventListener(eventName, handleRefresh);
    });

    return () => {
      // Remove all listeners on cleanup
      allEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleRefresh);
      });
    };
  }, [handleRefresh, eventNames]);

  return handleRefresh;
};