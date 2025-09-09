import { useEffect, useCallback } from 'react';

export const useAutoRefresh = (refreshCallback: () => void, eventNames: string[] = []) => {
  const handleRefresh = useCallback((event?: any) => {
    // Add a small delay to ensure database changes are complete
    setTimeout(() => {
      refreshCallback();
    }, 500);
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