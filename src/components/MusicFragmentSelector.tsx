"use client";

import {
  CheckCircle2,
  Clock,
  Link2,
  Music2,
  Pause,
  Play,
  Scissors,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect } from "react";
import {
  formatSecondsToMmSs,
  parseMusicUrl,
  resolveSongMetadataAndAudio,
  type ThemeId,
} from "@/types/gift";

interface MusicFragmentSelectorProps {
  theme: ThemeId;
  songTitle: string;
  onSongTitleChange: (title: string) => void;
  musicUrl: string;
  onMusicUrlChange: (url: string) => void;
  startSeconds: number;
  onStartSecondsChange: (sec: number) => void;
  clipDuration: number;
  onClipDurationChange: (dur: number) => void;
  isPreviewPlaying: boolean;
  onPreviewPlayingChange: (playing: boolean) => void;
}

const TOTAL_TIMELINE_SECONDS = 240; // 04:00 max timeline range

// Deterministic waveform bar heights (0.25 to 1.0) for Instagram-Stories visual trimmer
const WAVEFORM_BARS = [
  { id: "w0", h: 35 },
  { id: "w1", h: 55 },
  { id: "w2", h: 42 },
  { id: "w3", h: 78 },
  { id: "w4", h: 64 },
  { id: "w5", h: 90 },
  { id: "w6", h: 50 },
  { id: "w7", h: 72 },
  { id: "w8", h: 95 },
  { id: "w9", h: 82 },
  { id: "w10", h: 60 },
  { id: "w11", h: 88 },
  { id: "w12", h: 100 },
  { id: "w13", h: 74 },
  { id: "w14", h: 52 },
  { id: "w15", h: 85 },
  { id: "w16", h: 92 },
  { id: "w17", h: 66 },
  { id: "w18", h: 48 },
  { id: "w19", h: 80 },
  { id: "w20", h: 96 },
  { id: "w21", h: 70 },
  { id: "w22", h: 58 },
  { id: "w23", h: 86 },
  { id: "w24", h: 94 },
  { id: "w25", h: 62 },
  { id: "w26", h: 45 },
  { id: "w27", h: 76 },
  { id: "w28", h: 88 },
  { id: "w29", h: 54 },
  { id: "w30", h: 68 },
  { id: "w31", h: 40 },
];

const SAMPLE_SONGS = [
  {
    label: "🟢 Ejemplo Spotify",
    title: "Perfect — Ed Sheeran",
    url: "https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v",
    start: 10,
  },
  {
    label: "🔴 Ejemplo YouTube",
    title: "Ed Sheeran — Perfect (Audio)",
    url: "https://www.youtube.com/watch?v=2Vv-BfVoq4g",
    start: 58,
  },
];

const CLIP_DURATIONS = [
  { label: "15s", value: 15 },
  { label: "30s (Historia)", value: 30 },
  { label: "45s", value: 45 },
  { label: "Completa", value: 0 },
];

export default function MusicFragmentSelector({
  songTitle,
  onSongTitleChange,
  musicUrl,
  onMusicUrlChange,
  startSeconds,
  onStartSecondsChange,
  clipDuration,
  onClipDurationChange,
  isPreviewPlaying,
  onPreviewPlayingChange,
}: MusicFragmentSelectorProps) {
  const parsed = parseMusicUrl(musicUrl);
  const hasAttemptedUrl = musicUrl.trim().length > 0;
  const isValidUrl = parsed.provider !== "none" && Boolean(parsed.id);

  // Automatically detect the real song & artist title when the user pastes a YouTube or Spotify link
  useEffect(() => {
    let active = true;
    if (!isValidUrl) return;
    resolveSongMetadataAndAudio(musicUrl).then((res) => {
      if (active && res?.displayTitle) {
        onSongTitleChange(res.displayTitle);
      }
    });
    return () => {
      active = false;
    };
  }, [musicUrl, isValidUrl, onSongTitleChange]);

  const effectiveClipWindow = clipDuration > 0 ? clipDuration : 60;
  const endSeconds = Math.min(
    TOTAL_TIMELINE_SECONDS,
    startSeconds + effectiveClipWindow,
  );

  const adjustStart = (delta: number) => {
    const next = Math.max(
      0,
      Math.min(TOTAL_TIMELINE_SECONDS - 10, startSeconds + delta),
    );
    onStartSecondsChange(next);
  };

  return (
    <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800/90 p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Music2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Música tipo Historia (Spotify / YouTube)
            </h3>
            <p className="text-[11px] text-zinc-500">
              Pega el link de tu canción y elige desde qué segundo quieres que
              suene
            </p>
          </div>
        </div>

        {/* Quick 1-Click Sample Links */}
        <div className="flex items-center gap-1.5">
          {SAMPLE_SONGS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                onMusicUrlChange(sample.url);
                onSongTitleChange(sample.title.trim());
                onStartSecondsChange(sample.start);
                onPreviewPlayingChange(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 transition-colors cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* URL Input + Song Title */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 space-y-1">
          <label
            htmlFor="musicUrlInput"
            className="text-[11px] font-medium text-zinc-400 flex items-center gap-1"
          >
            <Link2 className="w-3 h-3 text-emerald-400" />
            <span>Link de Spotify o YouTube</span>
          </label>
          <div className="relative">
            <input
              id="musicUrlInput"
              type="url"
              value={musicUrl}
              onChange={(e) => onMusicUrlChange(e.target.value)}
              placeholder="https://open.spotify.com/track/... o https://youtu.be/..."
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-3.5 pr-9 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
            />
            {hasAttemptedUrl && (
              <button
                type="button"
                onClick={() => {
                  onMusicUrlChange("");
                  onPreviewPlayingChange(false);
                }}
                aria-label="Limpiar enlace de música"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="sm:col-span-5 space-y-1">
          <label
            htmlFor="songTitleInput"
            className="text-[11px] font-medium text-zinc-400 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Título en la tarjeta</span>
          </label>
          <input
            id="songTitleInput"
            type="text"
            maxLength={60}
            value={songTitle}
            onChange={(e) => onSongTitleChange(e.target.value)}
            placeholder="Nombre de la canción..."
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
          />
        </div>
      </div>

      {/* Detection Status Banner */}
      {hasAttemptedUrl && (
        <div
          className={`rounded-xl px-3 py-2 border text-xs flex items-center justify-between gap-2 ${
            parsed.provider === "spotify"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : parsed.provider === "youtube"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}
        >
          {parsed.provider === "spotify" ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Spotify conectado:</strong> Se detendrá automáticamente
                al pasar al siguiente paso.
              </span>
            </div>
          ) : parsed.provider === "youtube" ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                <strong>YouTube conectado:</strong> Sonará desde el segundo
                elegido y se pausará al avanzar de paso.
              </span>
            </div>
          ) : (
            <span>
              ⚠️ Pega un enlace válido de{" "}
              <strong>open.spotify.com/track/...</strong> o{" "}
              <strong>youtube.com/watch?v=...</strong>
            </span>
          )}
        </div>
      )}

      {/* Instagram-Stories-Style Fragment Trimmer */}
      <div
        className={`rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5 space-y-3 transition-opacity ${
          isValidUrl ? "opacity-100" : "opacity-75"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Recortar parte favorita (Estilo Historia):</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Selected Timestamp Range Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-xs font-mono font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {clipDuration > 0
                  ? `${formatSecondsToMmSs(startSeconds)} — ${formatSecondsToMmSs(endSeconds)}`
                  : `Inicia en ${formatSecondsToMmSs(startSeconds)}`}
              </span>
            </div>

            {/* Explicit Preview Play / Stop Button */}
            <button
              type="button"
              onClick={() => onPreviewPlayingChange(!isPreviewPlaying)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isPreviewPlaying
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                  : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20"
              }`}
            >
              {isPreviewPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Detener prueba</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Probar fragmento</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visual Waveform Trimmer Bar */}
        <div className="relative pt-1 pb-2">
          <div
            className="h-12 rounded-xl bg-zinc-950 border border-zinc-800 px-3 flex items-center justify-between gap-1 overflow-hidden"
            aria-hidden="true"
          >
            {WAVEFORM_BARS.map((bar, index) => {
              const barSecond =
                (index / WAVEFORM_BARS.length) * TOTAL_TIMELINE_SECONDS;
              const inSelectedWindow =
                barSecond >= startSeconds && barSecond <= endSeconds;

              return (
                <div
                  key={bar.id}
                  style={{ height: `${bar.h}%` }}
                  className={`flex-1 rounded-full transition-all duration-200 ${
                    inSelectedWindow
                      ? "bg-gradient-to-t from-amber-500 via-orange-400 to-emerald-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-y-105"
                      : "bg-zinc-800"
                  }`}
                />
              );
            })}
          </div>

          {/* Interactive Range Slider */}
          <input
            type="range"
            min={0}
            max={TOTAL_TIMELINE_SECONDS - 15}
            step={1}
            value={startSeconds}
            onChange={(e) => onStartSecondsChange(Number(e.target.value))}
            aria-label="Seleccionar segundo de inicio de la canción"
            className="w-full mt-2.5 accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1">
            <span>00:00</span>
            <span>
              {parsed.provider === "spotify"
                ? "Nota: Sin sesión en Spotify web, el preview dura 00:30"
                : "Arrastra para elegir dónde empieza el coro"}
            </span>
            <span>04:00</span>
          </div>
        </div>

        {/* Fine-Tune Second Controls + Clip Duration Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-zinc-400 mr-1">Ajuste fino:</span>
            {[
              { label: "-5s", delta: -5 },
              { label: "-1s", delta: -1 },
              { label: "+1s", delta: 1 },
              { label: "+5s", delta: 5 },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => adjustStart(btn.delta)}
                className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-zinc-400 mr-1">Duración:</span>
            {CLIP_DURATIONS.map((dur) => (
              <button
                key={dur.label}
                type="button"
                onClick={() => onClipDurationChange(dur.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  clipDuration === dur.value
                    ? "bg-amber-400 text-zinc-950"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
