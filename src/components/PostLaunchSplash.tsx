// src/components/PostLaunchSplash.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  children?: React.ReactNode;
  launchIso?: string; // ISO string, e.g. "2025-09-27T00:00:00+01:00"
  serverTimeUrl?: string | null; // optional endpoint returning { now: "2025-08-30T12:34:56.789Z" }
  userId?: string | null; // optional: if provided splash is tracked per-user+date
  displayMs?: number; // how long to auto-show (ms). default 20000 (20s)
};

function getDateKey(date: Date) {
  // YYYY-MM-DD local date string for per-day key
  return date.toISOString().slice(0, 10);
}

export default function PostLaunchSplash({
  children,
  launchIso = import.meta.env.VITE_LAUNCH_DATE ?? "2025-09-27T00:00:00+01:00",
  serverTimeUrl = null,
  userId = null,
  displayMs = 20_000,
}: Props) {
  const navigate = useNavigate();
  const [serverOffset, setServerOffset] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // get authoritative now (server) if provided
  useEffect(() => {
    let mounted = true;
    if (!serverTimeUrl) {
      setLoading(false);
      return;
    }
    fetch(serverTimeUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        // expected: { now: "2025-08-30T12:34:56.789Z" }
        const serverNow = new Date(data.now).getTime();
        const clientNow = Date.now();
        setServerOffset(serverNow - clientNow);
      })
      .catch(() => {
        // ignore; fallback to client time
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [serverTimeUrl]);

  // decide whether to show splash
  useEffect(() => {
    if (typeof window === "undefined") return;

    // dev convenience: don't show on localhost
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      setVisible(false);
      return;
    }

    // If still loading server time, wait (effect above toggles loading)
    if (loading) return;

    const now = new Date(Date.now() + serverOffset);
    const launchDate = new Date(launchIso);

    // If current time is earlier than launch, do nothing
    if (now < launchDate) {
      setVisible(false);
      return;
    }

    // Compose a per-day key using the server date if serverOffset provided
    const dayKey = getDateKey(new Date(now.toISOString().slice(0, 10)));
    const storageKey = userId ? `post_launch_splash_${dayKey}_${userId}` : `post_launch_splash_${dayKey}`;

    // If already seen for this day, skip
    if (localStorage.getItem(storageKey)) {
      setVisible(false);
      return;
    }

    // Otherwise show splash
    setVisible(true);

    // auto-mark as seen after displayMs when visible closes
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, "1");
      setVisible(false);
    }, displayMs);

    return () => clearTimeout(timer);
  }, [launchIso, serverOffset, loading, userId, displayMs]);

  // compute time since launch for messaging
  const timeSince = useMemo(() => {
    const now = Date.now() + serverOffset;
    const launch = new Date(launchIso).getTime();
    const diffMs = Math.max(0, now - launch);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  }, [launchIso, serverOffset]);

  // When not visible, simply render children (no overlay)
  if (!visible) return <>{children}</>;

  // If visible, render children underneath and full-screen overlay on top (blocks interaction)
  return (
    <>
      {children}
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-solarcore-orange/85 via-solarcore-yellow/60 to-solarcore-blue/40">
        <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />

        <div className="relative z-10 max-w-3xl w-full mx-4 p-8 rounded-2xl bg-white/8 border border-white/20 shadow-2xl text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-4">
            Solaco has launched 🎉
          </h2>

          <p className="text-sm md:text-base text-white/90 mb-6">
            {timeSince.hours > 0
              ? `Solaco launched ${timeSince.hours} hour${timeSince.hours > 1 ? "s" : ""} ${timeSince.minutes} minute${timeSince.minutes !== 1 ? "s" : ""} ago.`
              : `Solaco launched ${timeSince.minutes} minute${timeSince.minutes !== 1 ? "s" : ""} ago.`}
            {"  "}Welcome — your smart home awaits.
          </p>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => {
                // mark seen
                const nowKey = getDateKey(new Date(Date.now() + serverOffset));
                const storageKey = userId ? `post_launch_splash_${nowKey}_${userId}` : `post_launch_splash_${nowKey}`;
                localStorage.setItem(storageKey, "1");
                setVisible(false);
              }}
              className="px-6 py-3 rounded-lg bg-white/90 text-gray-900 font-semibold shadow hover:scale-[1.02] transition"
            >
              Proceed to Dashboard
            </button>

            <button
              onClick={() => {
                // also allow user to go to landing (optional)
                const nowKey = getDateKey(new Date(Date.now() + serverOffset));
                const storageKey = userId ? `post_launch_splash_${nowKey}_${userId}` : `post_launch_splash_${nowKey}`;
                localStorage.setItem(storageKey, "1");
                navigate("/");
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
