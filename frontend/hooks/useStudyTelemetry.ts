'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseStudyTelemetryProps {
  userId: string;
  topicId?: string;
  enabled?: boolean;
}

export function useStudyTelemetry({ userId, topicId, enabled = true }: UseStudyTelemetryProps) {
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const accumulatedUnsentRef = useRef<number>(0);
  const lastActiveTimestampRef = useRef<number>(0);
  const activeSecondsRef = useRef<number>(0);

  // Sync ref with state & initialize timestamp on mount
  useEffect(() => {
    lastActiveTimestampRef.current = Date.now();
  }, []);

  useEffect(() => {
    activeSecondsRef.current = activeSeconds;
  }, [activeSeconds]);


  // Flush accumulated seconds to server
  const flushHeartbeat = useCallback(async () => {
    const secondsToFlush = accumulatedUnsentRef.current;
    if (secondsToFlush <= 0 || !userId) return;

    try {
      const payload = {
        userId,
        topicId,
        activeSeconds: secondsToFlush,
        timestamp: new Date().toISOString(),
      };

      // Reset local accumulator before network call
      accumulatedUnsentRef.current = 0;

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/telemetry/heartbeat', blob);
      } else {
        await fetch('/api/telemetry/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      console.warn('Telemetry flush failed:', err);
    }
  }, [userId, topicId]);

  useEffect(() => {
    if (!enabled) return;

    // Activity detector listener
    const onUserActivity = () => {
      lastActiveTimestampRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, onUserActivity, { passive: true }));

    // Heartbeat ticker: runs every 1 second
    const tickInterval = window.setInterval(() => {
      const isVisible = typeof document !== 'undefined' && document.visibilityState === 'visible';
      const isRecentlyActive = Date.now() - lastActiveTimestampRef.current < 45000; // within 45s

      if (isVisible && isRecentlyActive) {
        setActiveSeconds((prev) => prev + 1);
        accumulatedUnsentRef.current += 1;
      }
    }, 1000);

    // Periodic flush to server every 60 seconds
    const flushInterval = window.setInterval(() => {
      if (accumulatedUnsentRef.current > 0) {
        flushHeartbeat();
      }
    }, 60000);

    // Visibility change / Unload listener
    const onVisibilityOrUnload = () => {
      if (document.visibilityState === 'hidden' && accumulatedUnsentRef.current > 0) {
        flushHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityOrUnload);
    window.addEventListener('beforeunload', onVisibilityOrUnload);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, onUserActivity));
      clearInterval(tickInterval);
      clearInterval(flushInterval);
      document.removeEventListener('visibilitychange', onVisibilityOrUnload);
      window.removeEventListener('beforeunload', onVisibilityOrUnload);
      flushHeartbeat();
    };
  }, [enabled, flushHeartbeat]);

  return {
    activeSeconds,
    flushHeartbeat,
  };
}
