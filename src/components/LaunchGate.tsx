import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type LaunchGateProps = {
  launchIso?: string;
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

export default function LaunchGate({
  children,
  launchIso = "2025-09-26T00:00:00+01:00",
  serverTimeUrl = null,
}: LaunchGateProps) {
  const navigate = useNavigate();

  const [nowOffsetMs, setNowOffsetMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(() => {
    const target = new Date(launchIso).getTime();
    return target - Date.now();
  });
  const [ready, setReady] = useState(() => remainingMs <= 0);

  useEffect(() => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      setReady(true);
    }
  }, []);

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
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [serverTimeUrl, launchIso]);

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

  if (ready) return <>{children}</>;

  const { d, h, m, s } = formatParts(remainingMs);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-500 animate-gradient" />

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
              delay: i * 0.4,
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
        transition={{ duration: 1 }}
      >
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900">
          We’re Launching Soon
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Our app goes live on{" "}
          <strong>September 26th, 2025 (Africa/Lagos)</strong>.
        </p>

        {/* Countdown boxes */}
        <div className="flex justify-center gap-4 text-white font-mono text-3xl mb-8">
          {[
            { label: "Days", val: d },
            { label: "Hours", val: h },
            { label: "Min", val: m },
            { label: "Sec", val: s },
          ].map((unit) => (
            <motion.div
              key={unit.label}
              className="bg-orange-600 rounded-lg px-4 py-2 shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div>{unit.val}</div>
              <div className="text-xs uppercase text-orange-100">
                {unit.label}
              </div>
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
      </motion.div>
    </div>
  );
}
