"use client";

import { Volume2, VolumeX } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { ambientAudio } from "@/lib/ambientAudio";

interface ClickBurst {
  id: number;
  x: number;
  y: number;
}

const RECT_PARTICLES = [
  { id: "r0", angle: 0, dist: 24, color: "bg-amber-400", w: "w-2.5", h: "h-1" },
  {
    id: "r1",
    angle: 45,
    dist: 20,
    color: "bg-orange-400",
    w: "w-2",
    h: "h-1.5",
  },
  { id: "r2", angle: 90, dist: 25, color: "bg-rose-400", w: "w-2.5", h: "h-1" },
  {
    id: "r3",
    angle: 135,
    dist: 19,
    color: "bg-sky-400",
    w: "w-2",
    h: "h-1",
  },
  {
    id: "r4",
    angle: 180,
    dist: 24,
    color: "bg-amber-300",
    w: "w-2.5",
    h: "h-1",
  },
  {
    id: "r5",
    angle: 225,
    dist: 21,
    color: "bg-emerald-400",
    w: "w-2",
    h: "h-1.5",
  },
  {
    id: "r6",
    angle: 270,
    dist: 25,
    color: "bg-rose-300",
    w: "w-2.5",
    h: "h-1",
  },
  {
    id: "r7",
    angle: 315,
    dist: 20,
    color: "bg-white",
    w: "w-2",
    h: "h-1",
  },
];

export default function AmbientMusicController() {
  const [state, setState] = useState({
    isMuted: false,
    isExternalPlaying: false,
    isStarted: false,
  });
  const [bursts, setBursts] = useState<ClickBurst[]>([]);

  useEffect(() => {
    const unsubscribe = ambientAudio.subscribe(setState);
    let burstCounter = 0;

    // Unlock ambient music, play soft low click sound, and spawn small rectangles burst
    const handlePointerDown = (e: PointerEvent) => {
      ambientAudio.startOnUserGesture();
      ambientAudio.playClickSound();

      burstCounter += 1;
      const newBurst: ClickBurst = {
        id: Date.now() * 100 + (burstCounter % 100),
        x: e.clientX,
        y: e.clientY,
      };

      setBursts((prev) => [...prev.slice(-6), newBurst]);
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== newBurst.id));
      }, 480);
    };

    const handleKeyDown = () => {
      ambientAudio.startOnUserGesture();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown, { once: true });

    return () => {
      unsubscribe();
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isAudible =
    state.isStarted && !state.isMuted && !state.isExternalPlaying;

  return (
    <>
      {/* Global Click Visual Burst of Small Rectangles */}
      <div
        className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
        aria-hidden="true"
      >
        {bursts.map((burst) => (
          <div
            key={burst.id}
            style={{ left: burst.x, top: burst.y }}
            className="absolute"
          >
            {RECT_PARTICLES.map((rect) => (
              <span
                key={rect.id}
                style={
                  {
                    "--rect-rot": `${rect.angle}deg`,
                    "--rect-dist": `${rect.dist}px`,
                  } as CSSProperties
                }
                className={`absolute left-0 top-0 rounded-[2px] shadow-sm animate-click-rect ${rect.w} ${rect.h} ${rect.color}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Floating Ambient Music Control Pill */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          type="button"
          onClick={() => ambientAudio.toggleMute()}
          title={
            state.isExternalPlaying
              ? "Música ambiental en pausa automática mientras suena el reproductor"
              : state.isMuted
                ? "Activar música ambiental"
                : "Silenciar música ambiental"
          }
          className={`group inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium backdrop-blur-xl shadow-lg transition-all cursor-pointer ${
            state.isExternalPlaying
              ? "bg-zinc-900/80 border-amber-400/30 text-amber-300/90"
              : isAudible
                ? "bg-zinc-900/85 border-zinc-700/80 text-zinc-200 hover:border-amber-400/50"
                : "bg-zinc-950/80 border-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {state.isMuted || !state.isStarted ? (
            <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <Volume2
              className={`w-3.5 h-3.5 ${
                state.isExternalPlaying
                  ? "text-amber-400"
                  : "text-emerald-400 animate-pulse"
              }`}
            />
          )}

          <span className="hidden sm:inline">
            {state.isExternalPlaying
              ? "Ambiental en pausa (Reproductor activo)"
              : !state.isStarted
                ? "Música ambiental"
                : state.isMuted
                  ? "Ambiental silenciada"
                  : "Música ambiental"}
          </span>
        </button>
      </div>
    </>
  );
}
