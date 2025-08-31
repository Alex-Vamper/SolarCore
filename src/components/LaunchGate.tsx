// src/components/LaunchGate.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // <- reuse existing client

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

  // compute effective launch ISO (prop > env > today@00:00 local)
  const effectiveLaunchIso = useMemo(() => {
    if (launchIso) return launchIso;
    if (import.meta.env.VITE_LAUNCH_DATE) return import.meta.env.VITE_LAUNCH_DATE;
    const d = new Date();
    d.setHours(0, 0, 0, 0); // today at 00:00 local
    return d.toISOString();
  }, [launchIso]);

  // server-client offset (serverNow - clientNow)
  const [nowOffsetMs, setNowOffsetMs] = useState<number>(0);

  // remaining ms until target (initialized from effectiveLaunchIso)
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const target = new Date(effectiveLaunchIso).getTime();
    return target - Date.now();
  });

  // ready when remaining <= 0
  const [ready, setReady] = useState<boolean>(() => remainingMs <= 0);

  // Dev convenience: bypass gate on localhost
  useEffect(() => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      setReady(true);
    }
  }, []);

  // Optionally fetch server time to compute offset
  useEffect(() => {
    if (!serverTimeUrl) return;
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
  }, [serverTimeUrl, effectiveLaunchIso]);

  // Tick every second to update remainingMs and flip ready when time reached
  useEffect(() => {
    const target = new Date(effectiveLaunchIso).getTime();
    const id = setInterval(() => {
      const clientNow = Date.now();
      const effectiveNow = clientNow + nowOffsetMs;
      const rem = target - effectiveNow;
      setRemainingMs(rem);
      if (rem <= 0) setReady(true);
    }, 1000);
    return () => clearInterval(id);
  }, [effectiveLaunchIso, nowOffsetMs]);

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
        <div className="flex justify-center gap-4 text-white font-mono text-3xl mb-8">
          {[{ label: "Days", val: d }, { label: "Hours", val: h }, { label: "Min", val: m }, { label: "Sec", val: s }].map((unit) => (
            <motion.div
              key={unit.label}
              className="bg-orange-600 rounded-lg px-4 py-2 shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div>{unit.val}</div>
              <div className="text-xs uppercase text-orange-100">{unit.label}</div>
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
        <p className="mt-2 text-sm text-gray-700">
          Not you?{" "}
          <span
            onClick={handleLogout}
            className="text-solarcore-blue-600 font-semibold cursor-pointer underline decoration-red-400 decoration-2 hover:opacity-80 active:scale-95 transition-transform duration-150"
          >
            Log out
          </span>
        </p>
      </motion.div>
    </div>
  );
}
