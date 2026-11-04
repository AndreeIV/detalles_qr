"use client";

import { ArrowLeft, QrCode, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import GiftExperience from "@/components/GiftExperience";
import {
  createDemoGiftForSlug,
  type GiftData,
  getGiftFromStorage,
  THEMES,
  type ThemeId,
} from "@/types/gift";

function RecipientExperienceContent() {
  const params = useParams<{ slug: string }>();
  const rawSlug = typeof params.slug === "string" ? params.slug : "especial";
  const slug = decodeURIComponent(rawSlug);

  const [gift, setGift] = useState<GiftData>(() => createDemoGiftForSlug(slug));
  const [isStoredGift, setIsStoredGift] = useState(false);

  useEffect(() => {
    const saved = getGiftFromStorage(slug);
    if (saved) {
      setGift(saved);
      setIsStoredGift(true);
    } else {
      setGift(createDemoGiftForSlug(slug));
      setIsStoredGift(false);
    }
  }, [slug]);

  const handleQuickDemoTheme = (nextTheme: ThemeId) => {
    const meta = THEMES[nextTheme];
    setGift((prev) => ({
      ...prev,
      theme: nextTheme,
      message: isStoredGift ? prev.message : meta.defaultMessage,
      songTitle: isStoredGift ? prev.songTitle : meta.defaultSong,
    }));
  };

  return (
    <div className="relative min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Subtle Top Bar for SaaS Viral Loop & Demo Theme Switcher */}
      <div className="fixed top-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 backdrop-blur-md shadow-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Crear el mío</span>
        </Link>

        {/* Demo Theme Switcher Pill so anyone testing /d/[slug] can also preview all 3 styles */}
        <div className="pointer-events-auto inline-flex items-center gap-1 p-1 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-md shadow-lg">
          {(["hotwheels", "flores", "aniversario"] as ThemeId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => handleQuickDemoTheme(id)}
              title={`Probar estilo ${THEMES[id].name}`}
              className={`w-7 h-7 rounded-full text-sm flex items-center justify-center transition-all cursor-pointer ${
                gift.theme === id
                  ? "bg-zinc-100 scale-105 shadow"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              {THEMES[id].emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Main Recipient Experience (Splash Unlock -> Themed Card) */}
      <main className="flex-1">
        <GiftExperience gift={gift} />
      </main>

      {/* Subtle SaaS Footer */}
      <footer className="py-4 px-4 text-center border-t border-zinc-900/80 bg-zinc-950">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-300 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>
            Hecho con DetallesQR • Crea un micro-detalle para alguien especial
          </span>
          <Sparkles className="w-3 h-3" />
        </Link>
      </footer>
    </div>
  );
}

function LoadingSplashFallback() {
  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-pulse mb-4">
        <QrCode className="w-7 h-7 text-amber-400" />
      </div>
      <p className="text-sm font-medium text-zinc-400 animate-pulse">
        Preparando tu detalle especial...
      </p>
    </div>
  );
}

export default function RecipientDetailPage() {
  return (
    <Suspense fallback={<LoadingSplashFallback />}>
      <RecipientExperienceContent />
    </Suspense>
  );
}
