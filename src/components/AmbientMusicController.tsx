"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { ambientAudio } from "@/lib/ambientAudio";

export default function AmbientMusicController() {
  const [state, setState] = useState({
    isMuted: false,
    isExternalPlaying: false,
    isStarted: false,
  });

  useEffect(() => {
    const unsubscribe = ambientAudio.subscribe(setState);

    // Unlock ambient music and play subtle tactile click sound on pointerdown
    const handlePointerDown = () => {
      ambientAudio.startOnUserGesture();
      ambientAudio.playClickSound();
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
  );
}
