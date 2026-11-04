"use client";

import { BatteryFull, Eye, Lock, Signal, Wifi } from "lucide-react";
import { useState } from "react";
import GiftExperience from "@/components/GiftExperience";
import type { GiftData } from "@/types/gift";

interface PhoneMockupProps {
  gift: GiftData;
}

export default function PhoneMockup({ gift }: PhoneMockupProps) {
  // Default to true in the builder so changes to photo/message are immediately visible,
  // while allowing 1-click toggle to inspect the Splash Screen!
  const [previewOpened, setPreviewOpened] = useState(true);

  const glowColor =
    gift.theme === "hotwheels"
      ? "from-sky-500/20 via-orange-500/15 to-red-600/20"
      : gift.theme === "flores"
        ? "from-amber-400/20 via-yellow-500/15 to-orange-500/15"
        : "from-rose-500/20 via-pink-500/15 to-red-600/20";

  return (
    <div className="flex flex-col items-center">
      {/* Interactive Preview Mode Switcher */}
      <div className="mb-4 inline-flex items-center p-1 rounded-full bg-zinc-900 border border-zinc-800 shadow-inner">
        <button
          type="button"
          onClick={() => setPreviewOpened(true)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            previewOpened
              ? "bg-zinc-100 text-zinc-950 shadow"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Tarjeta Abierta</span>
        </button>
        <button
          type="button"
          onClick={() => setPreviewOpened(false)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            !previewOpened
              ? "bg-zinc-100 text-zinc-950 shadow"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Splash Apertura</span>
        </button>
      </div>

      {/* Outer Ambient Glow + iPhone Frame */}
      <div className="relative">
        <div
          className={`absolute -inset-6 rounded-[64px] bg-gradient-to-tr ${glowColor} blur-2xl pointer-events-none transition-colors duration-500`}
        />

        {/* Side Hardware Buttons */}
        <div className="absolute -left-[3px] top-28 w-[3px] h-8 bg-zinc-700 rounded-l-md" />
        <div className="absolute -left-[3px] top-40 w-[3px] h-12 bg-zinc-700 rounded-l-md" />
        <div className="absolute -left-[3px] top-56 w-[3px] h-12 bg-zinc-700 rounded-l-md" />
        <div className="absolute -right-[3px] top-44 w-[3px] h-16 bg-zinc-700 rounded-r-md" />

        {/* iPhone Bezel */}
        <div className="relative w-[335px] sm:w-[360px] rounded-[50px] p-[11px] bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-zinc-600/50">
          {/* Inner Screen */}
          <div className="relative w-full h-[665px] rounded-[40px] bg-zinc-950 overflow-hidden flex flex-col border border-black">
            {/* Top Status Bar & Notch / Dynamic Island */}
            <div className="relative z-30 flex items-center justify-between px-6 pt-3 pb-2 bg-zinc-950/90 backdrop-blur-md text-[11px] font-semibold text-zinc-200 select-none shrink-0">
              <span>9:41</span>

              {/* Notch / Dynamic Island */}
              <div className="w-24 h-6 rounded-full bg-black border border-zinc-800/80 flex items-center justify-end px-2.5 shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-950 border border-indigo-500/30" />
              </div>

              <div className="flex items-center gap-1.5 text-zinc-200">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <BatteryFull className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Scrollable Interactive Viewport */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <GiftExperience
                gift={gift}
                isOpen={previewOpened}
                onOpenChange={setPreviewOpened}
                inMockup
              />
            </div>

            {/* iOS Home Indicator */}
            <div className="py-2 bg-zinc-950 flex justify-center shrink-0">
              <div className="w-28 h-1 rounded-full bg-zinc-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
