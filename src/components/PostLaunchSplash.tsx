// src/components/PostLaunchSplash.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  children?: React.ReactNode;
  launchIso?: string | null; // optional ISO string override
  serverTimeUrl?: string | null; // optional endpoint returning { now: "2025-08-30T12:34:56.789Z" }
  userId?: string | null; // optional: if provided splash is tracked per-user+date
  displayMs?: number; // how long to auto-show (ms). default 20000 (20s)
};

function getDateKey(date: Date) {
  // YYYY-MM-DD (UTC date portion) — used as the per-day key
  return date.toISOString().slice(0, 10);
}

/**
 * PostLaunchSplash
 *
 * - By default (no launchIso provided), treats *today at 00:00 local time* as the launch moment.
 * - Shows once per device (or once-per-user if you pass userId) per day.
 * - Optionally uses serverTimeUrl to get authoritative time.
 * - When visible, overlays a full-screen celebratory splash and blocks interaction below.
 * - Includes smooth fade-in / fade-out transitions for the splash overlay.
 */
export default function PostLaunchSplash({
  children,
  launchIso = null,
  serverTimeUrl = null,
  userId = null,
  displayMs = 20_000,
}: Props) {
  const navigate = useNavigate();
  const [serverOffset, setServerOffset] = useState<number>(0); // serverNow - clientNow
  const [visible, setVisible] = useState<boolean>(false); // whether splash should be rendered
  const [showing, setShowing] = useState<boolean>(false); // controls fade animations
  const [loadingServerTime, setLoadingServerTime] = useState<boolean>(true);

  // Compute the effective launch ISO:
  // - prefer explicit launchIso (prop)
  // - else prefer VITE_LAUNCH_DATE env var
  // - else default to today at 00:00 local time
  const effectiveLaunchIso = useMemo(() => {
    if (launchIso) return launchIso;
    if (import.meta.env.VITE_LAUNCH_DATE) return import.meta.env.VITE_LAUNCH_DATE;
    // compute today's local midnight
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString(); // expresses local-midnight moment in ISO (UTC adjusted)
  }, [launchIso]);

  // If provided, fetch server time once to compute offset
  useEffect(() => {
    let mounted = true;
    if (!serverTimeUrl) {
      setLoadingServerTime(false);
      return;
    }
    fetch(serverTimeUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        // expect { now: "2025-08-30T12:34:56.789Z" }
        const serverNow = new Date(data.now).getTime();
        const clientNow = Date.now();
        setServerOffset(serverNow - clientNow);
      })
      .catch(() => {
        // ignore errors, fallback to client time
      })
      .finally(() => {
        if (mounted) setLoadingServerTime(false);
      });
    return () => {
      mounted = false;
    };
  }, [serverTimeUrl]);

  // decide whether to show the splash (runs after serverTime fetch completes)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Wait for server time to finish loading (if provided)
    if (loadingServerTime) return;

    const now = new Date(Date.now() + serverOffset);
    const launchDate = new Date(effectiveLaunchIso);

    // If current time is earlier than launch, do nothing (no splash)
    if (now < launchDate) {
      setVisible(false);
      return;
    }

    // Compose per-day (YYYY-MM-DD) key using the server-compensated date
    const dayKey = getDateKey(new Date(now.toISOString().slice(0, 10)));
    const storageKey = userId ? `post_launch_splash_${dayKey}_${userId}` : `post_launch_splash_${dayKey}`;

    // If already seen for this day, skip
    if (localStorage.getItem(storageKey)) {
      setVisible(false);
      return;
    }

    // Otherwise show splash and auto-mark as seen after displayMs
    setVisible(true);
    setTimeout(() => setShowing(true), 1500); // fade-in trigger
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, "1");
      setShowing(false); // trigger fade-out
      setTimeout(() => setVisible(false), 500); // allow fade-out before removing
    }, displayMs);

    return () => clearTimeout(timer);
  }, [effectiveLaunchIso, serverOffset, loadingServerTime, userId, displayMs]);

  // compute time since launch for messaging
  const timeSince = useMemo(() => {
    const now = Date.now() + serverOffset;
    const launch = new Date(effectiveLaunchIso).getTime();
    const diffMs = Math.max(0, now - launch);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  }, [effectiveLaunchIso, serverOffset]);

  // If not visible, render children normally
  if (!visible) return <>{children}</>;

  // If visible: render children underneath and overlay full-screen celebratory splash
  return (
    <>
      {children}
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-500 ${
          showing ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Background gradient (SolarCore feel) */}
        <div className="absolute inset-0 bg-gradient-to-br from-solarcore-orange/85 via-solarcore-yellow/60 to-solarcore-blue/40 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-black/25 backdrop-blur-sm transition-opacity duration-500" />

        {/* Content box with fade + slight scale animation */}
        <div
          className={`relative z-10 max-w-3xl w-full mx-4 p-8 rounded-2xl bg-white/8 border border-white/20 shadow-2xl text-center transform transition-all duration-500 ${
            showing ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-4">
            SolarCore has launched 🎉
          </h2>

          <p className="text-sm md:text-base text-white/90 mb-6">
            {timeSince.hours > 0
              ? `SolarCore launched ${timeSince.hours} hour${timeSince.hours > 1 ? "s" : ""} ${timeSince.minutes} minute${timeSince.minutes !== 1 ? "s" : ""} ago.`
              : `SolarCore launched ${timeSince.minutes} minute${timeSince.minutes !== 1 ? "s" : ""} ago.`}
            {"  "}Welcome — your smart home awaits.
          </p>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => {
                // mark seen (per-day key) and close splash
                const nowKey = getDateKey(new Date(Date.now() + serverOffset));
                const storageKey = userId ? `post_launch_splash_${nowKey}_${userId}` : `post_launch_splash_${nowKey}`;
                localStorage.setItem(storageKey, "1");
                setShowing(false); // fade out smoothly
                setTimeout(() => setVisible(false), 500);
              }}
              className="px-6 py-3 rounded-lg bg-white/90 text-gray-900 font-semibold shadow hover:scale-[1.02] transition"
            >
              Proceed to Dashboard
            </button>

            <button
              onClick={() => {
                const nowKey = getDateKey(new Date(Date.now() + serverOffset));
                const storageKey = userId ? `post_launch_splash_${nowKey}_${userId}` : `post_launch_splash_${nowKey}`;
                localStorage.setItem(storageKey, "1");
                setShowing(false); // fade out smoothly
                setTimeout(() => {
                  setVisible(false);
                  navigate("/");
                }, 500);
              }}
              className="px-6 py-3 rounded-lg bg-transparent border border-white/30 text-white hover:bg-white/10 transition"
            >
              Back to Landing
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
