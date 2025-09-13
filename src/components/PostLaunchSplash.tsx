// src/components/PostLaunchSplash.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";

type Props = {
  children?: React.ReactNode;
  launchIso?: string | null; // optional ISO string override
  serverTimeUrl?: string | null; // optional endpoint returning { now: "2025-08-30T12:34:56.789Z" }
  userId?: string | null; // optional: if provided splash is tracked per-user+date
  displayMs?: number; // how long to auto-show (ms). default 20000 (20s)
};

function getDateKey(date: Date) {
  // YYYY-MM-DD (UTC date portion)
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
  const { launchStatus, loading: launchLoading } = useLaunchStatus();
  const [serverOffset, setServerOffset] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);
  const [showing, setShowing] = useState<boolean>(false);
  const [loadingServerTime, setLoadingServerTime] = useState<boolean>(true);

  // Effective launch ISO (priority: prop > admin backend > env > default)
  const effectiveLaunchIso = useMemo(() => {
    if (launchIso) return launchIso;
    if (launchStatus?.success && launchStatus.launch_date) return launchStatus.launch_date;
    if (import.meta.env.VITE_LAUNCH_DATE) return import.meta.env.VITE_LAUNCH_DATE;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [launchIso, launchStatus]);

  // Use backend server time or fetch from URL
  useEffect(() => {
    // If we have backend server time, use it
    if (launchStatus?.success && launchStatus.server_time) {
      const serverTime = new Date(launchStatus.server_time).getTime();
      const clientTime = Date.now();
      setServerOffset(serverTime - clientTime);
      setLoadingServerTime(false);
      return;
    }

    // Otherwise fetch from provided URL
    let mounted = true;
    if (!serverTimeUrl) {
      setLoadingServerTime(false);
      return;
    }
    fetch(serverTimeUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const serverNow = new Date(data.now).getTime();
        const clientNow = Date.now();
        setServerOffset(serverNow - clientNow);
      })
      .catch(() => {
        // ignore errors
      })
      .finally(() => {
        if (mounted) setLoadingServerTime(false);
      });
    return () => {
      mounted = false;
    };
  }, [serverTimeUrl, launchStatus]);

  // Decide splash visibility
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loadingServerTime || launchLoading) return;

    const now = new Date(Date.now() + serverOffset);
    const launchDate = new Date(effectiveLaunchIso);

    if (now < launchDate) {
      setVisible(false);
      return;
    }

    // Day + user key
    const dayKey = getDateKey(now);
    const storageKey = userId
      ? `post_launch_splash_${userId}_${dayKey}`
      : `post_launch_splash_${dayKey}`;

    if (localStorage.getItem(storageKey)) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setTimeout(() => setShowing(true), 1500);
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, "1");
      setShowing(false);
      setTimeout(() => setVisible(false), 500);
    }, displayMs);

    return () => clearTimeout(timer);
  }, [effectiveLaunchIso, serverOffset, loadingServerTime, userId, displayMs, launchLoading]);

  // Time since launch
  const timeSince = useMemo(() => {
    const now = Date.now() + serverOffset;
    const launch = new Date(effectiveLaunchIso).getTime();
    const diffMs = Math.max(0, now - launch);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  }, [effectiveLaunchIso, serverOffset]);

  if (!visible) return <>{children}</>;

  return (
    <>
      {children}
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-500 ${
          showing ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-solarcore-orange/85 via-solarcore-yellow/60 to-solarcore-blue/40" />
        <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />

        <div
          className={`relative z-10 max-w-3xl w-full mx-4 p-8 rounded-2xl bg-white/8 border border-white/20 shadow-2xl text-center transform transition-all duration-500 ${
            showing ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <h2 className="app-text text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-4">
            SolarCore has launched 🎉
          </h2>

          <p className="app-text md:text-base text-white/90 mb-6">
            {timeSince.hours > 0
              ? `SolarCore launched ${timeSince.hours} hour${
                  timeSince.hours > 1 ? "s" : ""
                } ${timeSince.minutes} minute${
                  timeSince.minutes !== 1 ? "s" : ""
                } ago.`
              : `SolarCore launched ${timeSince.minutes} minute${
                  timeSince.minutes !== 1 ? "s" : ""
                } ago.`}{" "}
            Welcome — your smart home awaits.
          </p>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => {
                const nowKey = getDateKey(new Date(Date.now() + serverOffset));
                const storageKey = userId
                  ? `post_launch_splash_${userId}_${nowKey}`
                  : `post_launch_splash_${nowKey}`;
                localStorage.setItem(storageKey, "1");
                setShowing(false);
                setTimeout(() => setVisible(false), 500);
              }}
              className="app-text px-6 py-3 rounded-lg bg-white/90 text-gray-900 font-semibold shadow hover:scale-[1.02] transition"
            >
              Proceed to Dashboard
            </button>

            <button
              onClick={() => {
                const nowKey = getDateKey(new Date(Date.now() + serverOffset));
                const storageKey = userId
                  ? `post_launch_splash_${userId}_${nowKey}`
                  : `post_launch_splash_${nowKey}`;
                localStorage.setItem(storageKey, "1");
                setShowing(false);
                setTimeout(() => {
                  setVisible(false);
                  navigate("/");
                }, 500);
              }}
              className="app-text px-6 py-3 rounded-lg bg-transparent border border-white/30 text-white hover:bg-white/10 transition"
            >
              Back to Landing
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
