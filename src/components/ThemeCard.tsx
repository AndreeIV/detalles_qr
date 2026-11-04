"use client";

import {
  CalendarHeart,
  Flame,
  Flower2,
  Heart,
  Music,
  Pause,
  Play,
  Sparkles,
  Trophy,
  Volume2,
} from "lucide-react";
import Image from "next/image";
import { type GiftData, THEMES } from "@/types/gift";

interface ThemeCardProps {
  gift: GiftData;
  daysTogether: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  compact?: boolean;
}

export default function ThemeCard({
  gift,
  daysTogether,
  isPlaying,
  onTogglePlay,
  compact = false,
}: ThemeCardProps) {
  const themeMeta = THEMES[gift.theme];
  const displayImage = gift.imageUrl || themeMeta.defaultImageSvg;
  const recipient = gift.recipientName.trim() || "Persona Especial";
  const sender = gift.senderName.trim() || "Alguien que te quiere";
  const dedication = gift.message.trim() || themeMeta.defaultMessage;
  const songLabel = gift.songTitle || themeMeta.defaultSong;

  if (gift.theme === "hotwheels") {
    return (
      <div className="relative w-full max-w-md mx-auto rounded-[28px] overflow-hidden border-2 border-sky-400/50 bg-gradient-to-b from-sky-900 via-blue-950 to-zinc-950 shadow-[0_20px_60px_-15px_rgba(249,115,22,0.45)] text-white">
        {/* Collector Peg Hook Cutout (Blister Pack Authentic Detail) */}
        <div className="pt-3 pb-1 flex flex-col items-center bg-gradient-to-r from-sky-600 via-blue-600 to-sky-500 border-b-4 border-orange-500 relative overflow-hidden">
          <div className="w-14 h-3.5 rounded-full bg-zinc-950/90 border border-sky-300/40 shadow-inner mb-2" />

          {/* Diagonal Racing Stripes */}
          <div className="absolute -right-8 top-0 bottom-0 w-24 bg-gradient-to-b from-orange-500 to-red-600 -skew-x-12 opacity-90 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500 text-[10px] font-black tracking-widest uppercase text-zinc-950 shadow">
            <Flame className="w-3 h-3 fill-zinc-950" />
            <span>{themeMeta.badgeText}</span>
          </div>

          <h2
            className={`${compact ? "text-xl" : "text-2xl"} relative z-10 mt-1.5 mb-2 font-black italic tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-orange-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] px-4 text-center`}
          >
            PARA {recipient}
          </h2>
        </div>

        <div className={`${compact ? "p-4 space-y-3.5" : "p-5 space-y-4"}`}>
          {/* Molded Plastic Blister Window Frame */}
          <div className="relative mx-auto aspect-square w-full max-w-[260px] rounded-2xl p-2 bg-gradient-to-br from-white/30 via-sky-200/10 to-orange-500/20 border-2 border-white/40 shadow-[inset_0_2px_12px_rgba(255,255,255,0.45),0_12px_25px_rgba(0,0,0,0.6)]">
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-zinc-900 border border-sky-300/30">
              <Image
                src={displayImage}
                alt={`Detalle para ${recipient}`}
                fill
                unoptimized
                className="object-cover"
              />
              {/* Plastic Blister Gloss Reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none" />
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-red-600/95 border border-yellow-300/70 text-[10px] font-black italic tracking-wider uppercase shadow">
                SERIE #01
              </div>
            </div>
          </div>

          {/* Dedication Card */}
          <div className="rounded-2xl bg-zinc-950/75 border border-sky-500/30 p-3.5 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-orange-500 to-red-600" />
            <p
              className={`font-serif italic text-zinc-100 leading-relaxed ${compact ? "text-xs" : "text-sm"}`}
            >
              “{dedication}”
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-orange-400">
              — Con cariño, {sender}
            </p>
          </div>

          {/* Telemetry Days Counter */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-600/25 via-red-600/20 to-sky-600/25 border border-orange-500/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-sky-200/80 font-semibold">
                  Kilometraje juntos
                </p>
                <p className="text-xs text-zinc-300">
                  Desde {gift.startDate || "el día uno"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black italic text-amber-300 tabular-nums">
                {daysTogether}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-orange-300">
                días juntos
              </span>
            </div>
          </div>

          {/* Simulated Music Player */}
          <MusicPlayerBar
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
            songLabel={songLabel}
            accentClass="bg-orange-500 hover:bg-orange-400 text-zinc-950"
            barColorClass="bg-orange-400"
            containerClass="bg-sky-950/80 border-sky-400/30"
          />
        </div>
      </div>
    );
  }

  if (gift.theme === "flores") {
    return (
      <div className="relative w-full max-w-md mx-auto rounded-[28px] overflow-hidden border border-amber-300/40 bg-gradient-to-b from-amber-950 via-zinc-900 to-zinc-950 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.35)] text-zinc-100">
        {/* Warm Sunbeam Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-44 rounded-full bg-amber-400/25 blur-3xl pointer-events-none" />

        <div
          className={`relative z-10 ${compact ? "p-4 space-y-3.5" : "p-5 space-y-4"}`}
        >
          {/* Top Spring Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/35 text-amber-300 text-[10px] font-semibold tracking-widest uppercase">
              <Flower2 className="w-3.5 h-3.5" />
              <span>{themeMeta.badgeText}</span>
            </div>
            <h2
              className={`font-serif font-bold text-amber-100 ${compact ? "text-xl" : "text-2xl"}`}
            >
              Para ti, {recipient} 🌻
            </h2>
          </div>

          {/* Authentic Polaroid Frame */}
          <div className="relative mx-auto w-full max-w-[265px] pt-2">
            {/* Washi Tape Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -rotate-2 z-20 w-20 h-5 bg-amber-200/70 backdrop-blur-sm border border-amber-300/40 shadow-sm" />

            <div className="bg-[#fcfaf2] p-3 pb-7 rounded-sm shadow-[0_14px_30px_rgba(0,0,0,0.55)] rotate-[0.8deg] transition-transform duration-300 hover:rotate-0">
              <div className="relative aspect-square w-full overflow-hidden bg-amber-100">
                <Image
                  src={displayImage}
                  alt={`Polaroid para ${recipient}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <p className="mt-3 text-center font-serif italic text-xs text-amber-950 font-medium">
                {sender} &amp; {recipient} • Siempre brillando ✨
              </p>
            </div>
          </div>

          {/* Elegant Dedication */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-400/25 p-4 text-center backdrop-blur-sm">
            <p
              className={`font-serif italic text-amber-50/95 leading-relaxed ${compact ? "text-xs" : "text-sm"}`}
            >
              “{dedication}”
            </p>
            <p className="mt-2 text-xs font-medium text-amber-300">
              Con todo mi cariño, {sender}
            </p>
          </div>

          {/* Days Counter */}
          <div className="flex items-center justify-between rounded-2xl bg-zinc-900/90 border border-amber-400/30 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-400/15 text-amber-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-amber-200">
                  Floreciendo juntos
                </p>
                <p className="text-[11px] text-zinc-400">
                  Desde {gift.startDate || "nuestro inicio"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-amber-300 tabular-nums">
                {daysTogether}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-amber-200/80">
                días juntos
              </span>
            </div>
          </div>

          {/* Simulated Music Player */}
          <MusicPlayerBar
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
            songLabel={songLabel}
            accentClass="bg-amber-400 hover:bg-amber-300 text-zinc-950"
            barColorClass="bg-amber-300"
            containerClass="bg-zinc-900/90 border-amber-400/25"
          />
        </div>
      </div>
    );
  }

  // Default / "aniversario" romantic theme
  return (
    <div className="relative w-full max-w-md mx-auto rounded-[28px] overflow-hidden border border-rose-400/35 bg-gradient-to-b from-rose-950 via-zinc-950 to-zinc-950 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.4)] text-zinc-100">
      {/* Romantic Aura */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-44 rounded-full bg-rose-500/25 blur-3xl pointer-events-none" />

      <div
        className={`relative z-10 ${compact ? "p-4 space-y-3.5" : "p-5 space-y-4"}`}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/35 text-rose-300 text-[10px] font-semibold tracking-widest uppercase">
            <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
            <span>{themeMeta.badgeText}</span>
          </div>
          <h2
            className={`font-serif font-bold text-rose-100 ${compact ? "text-xl" : "text-2xl"}`}
          >
            {sender} &amp; {recipient}
          </h2>
        </div>

        {/* Centered Framed Photo */}
        <div className="relative mx-auto aspect-square w-full max-w-[255px] rounded-3xl p-1.5 bg-gradient-to-br from-rose-300/50 via-pink-500/30 to-red-600/50 shadow-[0_12px_30px_rgba(225,29,72,0.3)]">
          <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-zinc-900">
            <Image
              src={displayImage}
              alt={`Recuerdo de ${sender} y ${recipient}`}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rose-950/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-rose-100/90 font-medium">
              <span>Nuestro momento</span>
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Romantic Serif Dedication */}
        <div className="rounded-2xl bg-rose-500/10 border border-rose-400/25 p-4 text-center backdrop-blur-sm">
          <p
            className={`font-serif italic text-rose-50 leading-relaxed ${compact ? "text-xs" : "text-sm"}`}
          >
            “{dedication}”
          </p>
          <p className="mt-2.5 text-xs font-medium text-rose-300">
            Siempre tuyo/a, {sender} ❤️
          </p>
        </div>

        {/* Days Together Counter */}
        <div className="flex items-center justify-between rounded-2xl bg-zinc-900/90 border border-rose-500/30 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-rose-500/15 text-rose-400">
              <CalendarHeart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-rose-200">
                Tiempo latiendo juntos
              </p>
              <p className="text-[11px] text-zinc-400">
                Desde {gift.startDate || "nuestro comienzo"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-rose-300 tabular-nums">
              {daysTogether}
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-rose-300/80">
              días juntos
            </span>
          </div>
        </div>

        {/* Simulated Music Player */}
        <MusicPlayerBar
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          songLabel={songLabel}
          accentClass="bg-rose-500 hover:bg-rose-400 text-white"
          barColorClass="bg-rose-400"
          containerClass="bg-zinc-900/90 border-rose-400/25"
        />
      </div>
    </div>
  );
}

interface MusicPlayerBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  songLabel: string;
  accentClass: string;
  barColorClass: string;
  containerClass: string;
}

function MusicPlayerBar({
  isPlaying,
  onTogglePlay,
  songLabel,
  accentClass,
  barColorClass,
  containerClass,
}: MusicPlayerBarProps) {
  return (
    <div
      className={`rounded-2xl border p-2.5 flex items-center gap-3 ${containerClass}`}
    >
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow ${accentClass}`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-100 truncate">
          <Music className="w-3 h-3 shrink-0 opacity-80" />
          <span className="truncate">
            {isPlaying
              ? "🎵 Reproduciendo canción especial"
              : "🎵 Canción en pausa"}
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{songLabel}</p>
      </div>

      {/* Equalizer animation */}
      <div
        className="flex items-end gap-0.5 h-4 px-1 shrink-0"
        aria-hidden="true"
      >
        <span
          className={`w-1 h-full rounded-full origin-bottom ${barColorClass} ${
            isPlaying ? "animate-eq-1" : "scale-y-25"
          }`}
        />
        <span
          className={`w-1 h-full rounded-full origin-bottom ${barColorClass} ${
            isPlaying ? "animate-eq-2" : "scale-y-50"
          }`}
        />
        <span
          className={`w-1 h-full rounded-full origin-bottom ${barColorClass} ${
            isPlaying ? "animate-eq-3" : "scale-y-35"
          }`}
        />
        <span
          className={`w-1 h-full rounded-full origin-bottom ${barColorClass} ${
            isPlaying ? "animate-eq-4" : "scale-y-25"
          }`}
        />
        <Volume2 className="w-3.5 h-3.5 text-zinc-400 ml-1" />
      </div>
    </div>
  );
}
