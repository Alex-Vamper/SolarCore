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
 * LaunchGate - Solar Core Auto Effect
 * 
 * Features the sophisticated "Solar Core Auto" animation system:
 * - Gradient pulse-glow hero text
 * - Background ambient orbs (orange/blue)
 * - Floating particle system
 * - Hardware-accelerated animations
 * - Three-layer depth system
 * - HSL-based color system
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
    let cancelled = false;
    const target = new Date(effectiveLaunchIso).getTime();
    const update = () => {
      const effectiveNow = Date.now() + nowOffsetMs;
      const rem = target - effectiveNow;
      if (!cancelled) {
        setRemainingMs(rem);
        
        // Only set ready if backend explicitly says launched OR countdown reaches zero
        if (launchStatus?.success && launchStatus.is_launched === true) {
          setReady(true);
        } else if (rem <= 0) {
          setReady(true);
        }
      }
    };

    // Initial run immediately
    update();

    const id = setInterval(update, 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [effectiveLaunchIso, nowOffsetMs, launchStatus?.success, launchStatus?.is_launched]);

  // Show loading while fetching launch status (but only for a reasonable time)
  if (launchLoading && !launchStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(220, 20%, 8%)' }}>
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

  // Logout function for shared devices
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'hsl(220, 20%, 8%)' }}>
      {/* Layer 1: Background ambient orbs */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: `hsl(${25} ${95}% ${53}%)` }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ 
            backgroundColor: `hsl(${200} ${95}% ${60}%)`,
            animationDelay: '1s' 
          }}
        />
      </div>

      {/* Layer 2: Main content */}
      <div className="relative z-10 text-center px-6">
        {/* Hero text with Solar Core Auto effect */}
        <h1 className="solar-hero mb-8">
          SolarCore
        </h1>
        
        <p className="text-xl md:text-2xl text-white/80 mb-4 font-medium">
          We're Launching Soon
        </p>
        
        <p className="text-sm md:text-base text-white/60 mb-12 max-w-md mx-auto">
          Our revolutionary smart home system goes live on <strong className="text-white/90">{displayLaunch}</strong>
        </p>

        {/* Countdown boxes with solar theme */}
        <div className="flex justify-center gap-4 mb-12">
          {[{ label: "Days", val: d }, { label: "Hours", val: h }, { label: "Min", val: m }, { label: "Sec", val: s }].map((unit, index) => (
            <motion.div
              key={unit.label}
              className="relative rounded-2xl px-6 py-4 text-center shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, hsl(25 95% 53% / 0.2), hsl(200 95% 60% / 0.2))',
                border: '1px solid hsl(25 95% 53% / 0.3)',
                backdropFilter: 'blur(10px)'
              }}
              animate={{ 
                scale: [1, 1.02, 1],
                boxShadow: [
                  '0 0 20px hsl(25 95% 53% / 0.3)',
                  '0 0 30px hsl(25 95% 53% / 0.5)',
                  '0 0 20px hsl(25 95% 53% / 0.3)'
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: index * 0.2
              }}
            >
              <div className="text-3xl md:text-4xl font-bold text-white font-mono">
                {unit.val}
              </div>
              <div className="text-xs md:text-sm uppercase tracking-wide text-white/70 mt-1">
                {unit.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(200 95% 60%))',
              boxShadow: '0 0 20px hsl(25 95% 53% / 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px hsl(25 95% 53% / 0.6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px hsl(25 95% 53% / 0.4)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            Back to Landing Page
          </button>

          <p className="text-sm text-white/60">
            Not you?{" "}
            <button
              onClick={handleLogout}
              className="text-white/80 font-semibold underline decoration-white/50 decoration-2 hover:text-white hover:decoration-white transition-colors duration-300 bg-transparent p-0 border-0"
            >
              Log out
            </button>
          </p>
        </div>
      </div>

      {/* Layer 3: Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: `hsl(${25} ${95}% ${53}%)`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </main>
  );
}
