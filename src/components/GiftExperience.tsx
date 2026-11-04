"use client";

import { Gift, LockOpen, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import ThemeCard from "@/components/ThemeCard";
import { calculateDaysTogether, type GiftData, THEMES } from "@/types/gift";

interface GiftExperienceProps {
  gift: GiftData;
  /** Controlled open state (used by PhoneMockup preview tabs) */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Compact layout when rendered inside the iPhone Mockup */
  inMockup?: boolean;
}

/**
 * Plays a gentle warm Web Audio API chord upon user gesture ("Toca para abrir")
 * so unlocking the experience feels tactile without requiring external MP3 assets.
 */
function playUnlockChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 major arpeggio

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.06, now + idx * 0.09 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.8);
    });
  } catch {
    // Ignore audio context restrictions silently
  }
}

export default function GiftExperience({
  gift,
  isOpen: controlledIsOpen,
  onOpenChange,
  inMockup = false,
}: GiftExperienceProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [nowTimestamp, setNowTimestamp] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    setNowTimestamp(Date.now());
  }, []);

  const unlocked =
    controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const setUnlocked = (next: boolean) => {
    if (onOpenChange) {
      onOpenChange(next);
    } else {
      setInternalOpen(next);
    }
  };

  const handleUnlock = () => {
    playUnlockChime();
    setIsPlaying(true);
    setUnlocked(true);
  };

  const themeMeta = THEMES[gift.theme];
  const senderDisplay = gift.senderName.trim() || "Alguien especial";
  const recipientDisplay = gift.recipientName.trim() || "ti";
  const daysTogether = calculateDaysTogether(gift.startDate, nowTimestamp);

  const splashAccent =
    gift.theme === "hotwheels"
      ? {
          glow: "bg-orange-500/25",
          ring: "border-orange-400/40 bg-gradient-to-br from-sky-600/30 to-orange-500/30",
          btn: "from-sky-500 via-blue-600 to-orange-500 text-white shadow-orange-500/30",
          pill: "text-orange-300 border-orange-400/30 bg-orange-500/10",
        }
      : gift.theme === "flores"
        ? {
            glow: "bg-amber-400/25",
            ring: "border-amber-300/40 bg-gradient-to-br from-amber-400/25 to-yellow-500/20",
            btn: "from-amber-300 via-yellow-400 to-amber-500 text-zinc-950 shadow-amber-400/30",
            pill: "text-amber-300 border-amber-400/30 bg-amber-400/10",
          }
        : {
            glow: "bg-rose-500/25",
            ring: "border-rose-400/40 bg-gradient-to-br from-rose-500/25 to-red-600/25",
            btn: "from-rose-500 via-pink-600 to-red-600 text-white shadow-rose-500/30",
            pill: "text-rose-300 border-rose-400/30 bg-rose-500/10",
          };

  if (!unlocked) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center text-center px-6 ${
          inMockup ? "min-h-[590px] py-8" : "min-h-dvh py-12"
        } bg-zinc-950 overflow-hidden select-none`}
      >
        {/* Ambient Pulsing Glow */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-3xl animate-pulse pointer-events-none ${splashAccent.glow}`}
        />

        {/* Top Intrigue Pill */}
        <div
          className={`relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[11px] font-semibold tracking-wider uppercase mb-7 ${splashAccent.pill}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Detalle Digital Exclusivo</span>
        </div>

        {/* Pulsing Gift Icon */}
        <div className="relative z-10 mb-8 flex items-center justify-center">
          <span
            className={`absolute inline-flex h-28 w-28 rounded-full opacity-35 animate-ping ${splashAccent.glow}`}
          />
          <div
            className={`relative w-24 h-24 rounded-3xl border flex items-center justify-center shadow-2xl backdrop-blur-md animate-pulse ${splashAccent.ring}`}
          >
            <span className="text-4xl" role="img" aria-label={themeMeta.name}>
              {themeMeta.emoji}
            </span>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg">
              <Gift className="w-4 h-4 text-zinc-200" />
            </div>
          </div>
        </div>

        {/* Intrigue Copy */}
        <div className="relative z-10 max-w-xs space-y-2.5 mb-9">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Hola, {recipientDisplay}
          </p>
          <h1
            className={`font-serif font-bold text-zinc-50 leading-snug ${
              inMockup ? "text-xl" : "text-2xl sm:text-3xl"
            }`}
          >
            Tienes un detalle especial de{" "}
            <span className="underline decoration-wavy decoration-white/30 underline-offset-4">
              {senderDisplay}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Sube el volumen de tu celular para vivir la experiencia completa con
            música.
          </p>
        </div>

        {/* Toca para abrir CTA */}
        <button
          type="button"
          onClick={handleUnlock}
          className={`relative z-10 group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${splashAccent.btn}`}
        >
          <LockOpen className="w-4 h-4 transition-transform group-hover:-rotate-12" />
          <span>Toca para abrir</span>
        </button>

        <p className="relative z-10 mt-6 text-[11px] text-zinc-500">
          Creado con amor en DetallesQR
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center ${
        inMockup ? "min-h-[590px] p-3.5" : "min-h-dvh px-4 py-8 sm:py-12"
      } bg-zinc-950`}
    >
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <ThemeCard
          gift={gift}
          daysTogether={daysTogether}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((prev) => !prev)}
          compact={inMockup}
        />

        {/* Replay Splash Button */}
        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setUnlocked(false)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1.5 px-3 rounded-full hover:bg-zinc-900 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ver pantalla de apertura</span>
          </button>
        </div>
      </div>
    </div>
  );
}
