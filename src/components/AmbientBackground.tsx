"use client";

import type { ThemeId } from "@/types/gift";

interface AmbientBackgroundProps {
  theme: ThemeId;
  /** Compact mode when used inside smaller containers */
  compact?: boolean;
}

interface ParticleSpec {
  id: string;
  left: string;
  top: string;
  delay: string;
  duration: string;
  size: string;
  symbolIdx: number;
}

const PARTICLES: ParticleSpec[] = [
  {
    id: "p1",
    left: "7%",
    top: "78%",
    delay: "0s",
    duration: "9s",
    size: "text-xl",
    symbolIdx: 0,
  },
  {
    id: "p2",
    left: "18%",
    top: "35%",
    delay: "1.8s",
    duration: "11s",
    size: "text-base",
    symbolIdx: 1,
  },
  {
    id: "p3",
    left: "32%",
    top: "85%",
    delay: "3.2s",
    duration: "10s",
    size: "text-lg",
    symbolIdx: 2,
  },
  {
    id: "p4",
    left: "52%",
    top: "72%",
    delay: "0.9s",
    duration: "12s",
    size: "text-xl",
    symbolIdx: 0,
  },
  {
    id: "p5",
    left: "68%",
    top: "82%",
    delay: "2.4s",
    duration: "9.5s",
    size: "text-base",
    symbolIdx: 1,
  },
  {
    id: "p6",
    left: "84%",
    top: "65%",
    delay: "4.1s",
    duration: "11.5s",
    size: "text-2xl",
    symbolIdx: 2,
  },
  {
    id: "p7",
    left: "92%",
    top: "38%",
    delay: "1.2s",
    duration: "10.5s",
    size: "text-lg",
    symbolIdx: 0,
  },
];

const THEME_SYMBOLS: Record<ThemeId, [string, string, string]> = {
  hotwheels: ["🏎️", "🔥", "⚡"],
  flores: ["🌻", "✨", "🌼"],
  aniversario: ["❤️", "✨", "💖"],
};

export default function AmbientBackground({
  theme,
  compact = false,
}: AmbientBackgroundProps) {
  const symbols = THEME_SYMBOLS[theme];

  const auroraColors =
    theme === "hotwheels"
      ? {
          orb1: "bg-sky-500/20",
          orb2: "bg-orange-500/20",
          orb3: "bg-red-600/15",
        }
      : theme === "flores"
        ? {
            orb1: "bg-amber-400/20",
            orb2: "bg-yellow-500/15",
            orb3: "bg-orange-400/15",
          }
        : {
            orb1: "bg-rose-500/20",
            orb2: "bg-pink-600/15",
            orb3: "bg-red-600/15",
          };

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Subtle perspective grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Drifting Aurora Blobs */}
      <div
        className={`absolute -top-28 -left-24 ${
          compact ? "w-64 h-64" : "w-[460px] h-[460px]"
        } rounded-full blur-3xl transition-colors duration-1000 animate-aurora-1 ${auroraColors.orb1}`}
      />
      <div
        className={`absolute top-1/3 -right-28 ${
          compact ? "w-64 h-64" : "w-[500px] h-[500px]"
        } rounded-full blur-3xl transition-colors duration-1000 animate-aurora-2 ${auroraColors.orb2}`}
      />
      <div
        className={`absolute -bottom-32 left-1/3 ${
          compact ? "w-56 h-56" : "w-[420px] h-[420px]"
        } rounded-full blur-3xl transition-colors duration-1000 animate-aurora-3 ${auroraColors.orb3}`}
      />

      {/* Floating Theme Particles */}
      {!compact &&
        PARTICLES.map((p) => (
          <span
            key={p.id}
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
            className={`absolute select-none animate-particle ${p.size}`}
          >
            {symbols[p.symbolIdx]}
          </span>
        ))}
    </div>
  );
}
