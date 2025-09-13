// src/components/LaunchGate.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";

type LaunchGateProps = {
  launchIso?: string | null;
  children: React.ReactNode;
  serverTimeUrl?: string | null;
};

function formatParts(ms: number) {
  if (ms <= 0) return { d: "00", h: "00", m: "00", s: "00" };
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / (3600 * 24));
  const h = Math.floor((totalSec % (3600 * 24)) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
}

/**
 * LaunchGate
 *
 * Behavior:
 * - effectiveLaunchIso is (in order):
 *   1) launchIso prop (if provided),
 *   2) import.meta.env.VITE_LAUNCH_DATE (if present),
 *   3) today at 00:00 local time (default).
 *
 * - Optionally uses serverTimeUrl to compute a server-client offset (prevents client clock tampering).
 * - On localhost / 127.0.0.1 the gate is bypassed (keeps dev experience smooth).
 */
export default function LaunchGate({
  children,
  launchIso = null,
  serverTimeUrl = null,
}: LaunchGateProps) {
  const navigate = useNavigate();
  const { launchStatus, loading: launchLoading, error: launchError } = useLaunchStatus();

  // compute effective launch ISO (priority: backend > prop > default)
  const effectiveLaunchIso = useMemo(() => {
    // Priority 1: Backend launch date (only if successfully loaded)
    if (launchStatus?.success && launchStatus.launch_date) {
      return launchStatus.launch_date;
    }
    // Priority 2: Prop override (for testing/admin)
    if (launchIso) return launchIso;
    // Priority 3: Default fallback (far future date to prevent bypass)
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1); // one year from now
    return d.toISOString();
  }, [launchIso, launchStatus]);

  // server-client offset (serverNow - clientNow) - use backend server time if available
  const [nowOffsetMs, setNowOffsetMs] = useState<number>(() => {
    if (launchStatus?.success && launchStatus.server_time) {
      const serverTime = new Date(launchStatus.server_time).getTime();
      const clientTime = Date.now();
      return serverTime - clientTime;
    }
    return 0;
  });

  // remaining ms until target (initialized from effectiveLaunchIso)
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const target = new Date(effectiveLaunchIso).getTime();
    return target - Date.now();
  });

  // ready when backend says we're launched or countdown reaches zero
  const [ready, setReady] = useState<boolean>(() => {
    // Only ready if backend explicitly says we're launched
    return launchStatus?.success && launchStatus.is_launched === true;
  });

  // Dev convenience: bypass gate on localhost
  useEffect(() => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      setReady(true);
    }
  }, []);

  // Update offset when backend data changes
  useEffect(() => {
    if (launchStatus?.success && launchStatus.server_time) {
      const serverTime = new Date(launchStatus.server_time).getTime();
      const clientTime = Date.now();
      setNowOffsetMs(serverTime - clientTime);
    }

    // Check if backend says we're launched
    if (launchStatus?.success && launchStatus.is_launched === true) {
      setReady(true);
      return;
    }

    // Update remaining time based on new launch date
    if (launchStatus?.success && launchStatus.launch_date) {
      const target = new Date(effectiveLaunchIso).getTime();
      const rem = target - (Date.now() + nowOffsetMs);
      setRemainingMs(rem);
      // Only set ready if backend says we're launched OR countdown reaches zero
      if (rem <= 0 && !launchStatus.is_launched) {
        setReady(true);
      }
    }
  }, [launchStatus, effectiveLaunchIso, nowOffsetMs]);

  // Optionally fetch server time to compute offset (fallback if no backend data)
  useEffect(() => {
    if (!serverTimeUrl || (launchStatus?.success && launchStatus.server_time)) return;
    let mounted = true;
    fetch(serverTimeUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        // expected: { now: "2025-08-30T12:34:56.789Z" }
        const serverNow = new Date(data.now).getTime();
        const clientNow = Date.now();
        const offset = serverNow - clientNow;
        setNowOffsetMs(offset);

        const target = new Date(effectiveLaunchIso).getTime();
        const rem = target - (clientNow + offset);
        setRemainingMs(rem);
        if (rem <= 0) setReady(true);
      })
      .catch(() => {
        // If server time fails, we silently fall back to client time
      });
    return () => {
      mounted = false;
    };
  }, [serverTimeUrl, effectiveLaunchIso, launchStatus]);

  // Tick every second to update remainingMs and flip ready when time reached
  useEffect(() => {
    // Skip countdown if backend says we're already launched
    if (launchStatus?.success && launchStatus.is_launched === true) {
      setReady(true);
      return;
    }

    // Only run countdown if we have backend data
    if (!launchStatus?.success || !launchStatus.launch_date) return;

    const target = new Date(effectiveLaunchIso).getTime();
    const id = setInterval(() => {
      const clientNow = Date.now();
      const effectiveNow = clientNow + nowOffsetMs;
      const rem = target - effectiveNow;
      setRemainingMs(rem);
      // Only set ready when countdown reaches zero (backend will control launch state)
      if (rem <= 0) setReady(true);
    }, 1000);
    return () => clearInterval(id);
  }, [effectiveLaunchIso, nowOffsetMs, launchStatus]);

  // Show loading while fetching launch status (but only for a reasonable time)
  if (launchLoading && !launchStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-500">
        <div className="text-white text-xl">Checking launch status...</div>
      </div>
    );
  }

  // Log backend status for debugging
  if (launchError) {
    console.warn('Failed to fetch launch status, using fallback:', launchError);
  }
  
  // Debug info
  console.log('Launch Status Debug:', {
    backendSuccess: launchStatus?.success,
    backendLaunched: launchStatus?.is_launched,
    backendDate: launchStatus?.launch_date,
    effectiveDate: effectiveLaunchIso,
    ready,
    remainingMs
  });

  // If ready -> render children (actual app)
  if (ready) {
    return <>{children}</>;
  }

  // Otherwise show the countdown gate
  const { d, h, m, s } = formatParts(remainingMs);

  // Friendly display of the effective launch date in Lagos timezone (falls back to browser locale)
  const displayLaunch = (() => {
    try {
      return new Date(effectiveLaunchIso).toLocaleString("en-GB", {
        timeZone: "Africa/Lagos",
        dateStyle: "long",
        timeStyle: "short",
      });
    } catch {
      return new Date(effectiveLaunchIso).toUTCString();
    }
  })();

  // New logout function for shared devices
  const handleLogout = async () => {
    await supabase.auth.signOut(); // properly end session
    navigate("/"); // send back to landing
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-500 animate-grad-slow bg-[length:200%_200%]" />

      {/* Subtle star sparkles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 3,
              delay: i * 0.35,
              repeat: Infinity,
              repeatType: "loop",
            }}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Countdown Card */}
      <motion.div
        className="relative z-10 max-w-xl w-full text-center rounded-2xl shadow-2xl p-10 bg-white/90 backdrop-blur"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900">
          We’re Launching Soon
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Our app goes live on <strong>{displayLaunch}</strong>.
        </p>

        {/* Countdown boxes */}
        <div className="app-text flex justify-center gap-4 text-white font-mono text-3xl mb-8">
          {[{ label: "Days", val: d }, { label: "Hours", val: h }, { label: "Min", val: m }, { label: "Sec", val: s }].map((unit) => (
            <motion.div
              key={unit.label}
              className="bg-orange-600 rounded-lg px-4 py-2 shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div>{unit.val}</div>
              <div className="app-text uppercase text-orange-100">{unit.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Back to Landing Page button */}
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-6 py-3 rounded-xl bg-orange-600 text-white font-semibold shadow-lg hover:bg-orange-700 transition"
        >
          Back to Landing Page
        </button>

        {/* Extra idea: Not you? Log out */}
        <p className="app-text mt-2 text-gray-700">
          Not you?{" "}
          <button
            onClick={handleLogout}
            className="text-red-600 font-semibold underline decoration-red-400 decoration-2 hover:opacity-80 active:scale-95 transition-transform duration-150 bg-transparent p-0 border-0"
          >
            Log out
          </button>
        </p>

      </motion.div>
    </div>
  );
}
