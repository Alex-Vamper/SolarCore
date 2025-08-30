// LaunchGate.tsx
import React, { useEffect, useState } from "react";

type LaunchGateProps = {
  launchIso?: string; // e.g. "2025-09-27T00:00:00+01:00"
  children: React.ReactNode;
  serverTimeUrl?: string | null; // optional endpoint to fetch authoritative time
};

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / (3600 * 24));
  const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(days)}:${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

export default function LaunchGate({
  children,
  launchIso = "2025-09-27T00:00:00+01:00", // default launch date
  serverTimeUrl = null,
}: LaunchGateProps) {
  const [nowOffsetMs, setNowOffsetMs] = useState<number>(0); // serverNow - clientNow
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const target = new Date(launchIso).getTime();
    return target - Date.now();
  });
  const [ready, setReady] = useState<boolean>(() => remainingMs <= 0);

  // Always bypass countdown in dev/local
  useEffect(() => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      setReady(true);
    }
  }, []);

  // Optionally fetch server time to prevent client clock tampering
  useEffect(() => {
    if (!serverTimeUrl) return;
    let mounted = true;
    fetch(serverTimeUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const serverNow = new Date(data.now).getTime();
        const clientNow = Date.now();
        setNowOffsetMs(serverNow - clientNow);
        const target = new Date(launchIso).getTime();
        const rem = target - (clientNow + (serverNow - clientNow));
        setRemainingMs(rem);
        if (rem <= 0) setReady(true);
      })
      .catch(() => {
        // ignore errors; fallback to client clock
      });
    return () => {
      mounted = false;
    };
  }, [serverTimeUrl, launchIso]);

  // Countdown tick
  useEffect(() => {
    const target = new Date(launchIso).getTime();
    const id = setInterval(() => {
      const clientNow = Date.now();
      const effectiveNow = clientNow + nowOffsetMs;
      const rem = target - effectiveNow;
      setRemainingMs(rem);
      if (rem <= 0) setReady(true);
    }, 1000);
    return () => clearInterval(id);
  }, [launchIso, nowOffsetMs]);

  // If ready -> render children (actual app)
  if (ready) {
    return <>{children}</>;
  }

  // Otherwise show the countdown gate
  const pretty = formatRemaining(remainingMs);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full text-center rounded-xl shadow-lg p-8 bg-white">
        <h1 className="text-2xl font-bold mb-3">We’re launching soon</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Our app will go live on{" "}
          <strong>September 27, 2025 (Africa/Lagos)</strong>.
        </p>

        <div className="text-3xl font-mono tracking-widest bg-gray-100 p-4 rounded">
          {pretty /* DD:HH:MM:SS */}
        </div>
      </div>
    </div>
  );
}
