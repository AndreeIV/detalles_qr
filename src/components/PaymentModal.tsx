"use client";

import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { type GiftData, saveGiftToStorage, THEMES } from "@/types/gift";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gift: GiftData;
}

type PaymentMethod = "yape" | "plin";

const TEST_PHONE = "938 985 009";
const TEST_PHONE_RAW = "938985009";

export default function PaymentModal({
  isOpen,
  onClose,
  gift,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("yape");
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedSlug, setConfirmedSlug] = useState<string | null>(null);

  if (!isOpen) return null;

  const themeMeta = THEMES[gift.theme];

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(TEST_PHONE_RAW);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const buildSlug = () => {
    const cleanPart = (text: string, fallback: string) =>
      (text.trim() || fallback)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 14) || fallback;

    const toSlug = cleanPart(gift.recipientName, "especial");
    const fromSlug = cleanPart(gift.senderName, "detalle");
    return `${gift.theme}-${fromSlug}-para-${toSlug}`;
  };

  const handleConfirmPayment = () => {
    setIsConfirming(true);
    setTimeout(() => {
      const finalSlug = buildSlug();
      saveGiftToStorage({
        ...gift,
        slug: finalSlug,
      });
      setIsConfirming(false);
      setConfirmedSlug(finalSlug);
    }, 900);
  };

  const sharePath = confirmedSlug ? `/d/${confirmedSlug}` : "";

  const handleCopyLink = async () => {
    if (!confirmedSlug || typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${sharePath}`,
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleResetAndClose = () => {
    setConfirmedSlug(null);
    setIsConfirming(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden text-zinc-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!confirmedSlug ? (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="space-y-1 pr-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Activación Instantánea • Pago Simulado</span>
              </div>
              <h2
                id="payment-modal-title"
                className="text-xl font-bold text-zinc-50"
              >
                Activa tu Detalle QR
              </h2>
              <p className="text-xs text-zinc-400">
                Temática{" "}
                <strong className="text-zinc-200">
                  {themeMeta.emoji} {themeMeta.name}
                </strong>{" "}
                • Acceso ilimitado + música + contador
              </p>
            </div>

            {/* Yape / Plin Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => setMethod("yape")}
                className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  method === "yape"
                    ? "bg-[#742384] text-white shadow-lg shadow-[#742384]/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                💜 Pagar con Yape
              </button>
              <button
                type="button"
                onClick={() => setMethod("plin")}
                className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  method === "plin"
                    ? "bg-[#00A8C6] text-zinc-950 shadow-lg shadow-[#00A8C6]/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                🩵 Pagar con Plin
              </button>
            </div>

            {/* Payment Card Info */}
            <div
              className={`rounded-2xl p-4 border transition-colors ${
                method === "yape"
                  ? "bg-[#742384]/15 border-[#742384]/40"
                  : "bg-[#00A8C6]/15 border-[#00A8C6]/40"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-300">
                  Total a transferir
                </span>
                <span className="text-2xl font-black text-white">
                  {themeMeta.pricePen}
                </span>
              </div>

              {/* Simulated QR + Phone Details */}
              <div className="flex items-center gap-4 bg-zinc-950/80 rounded-xl p-3 border border-zinc-800">
                <div className="w-20 h-20 rounded-lg bg-white p-1.5 shrink-0 flex items-center justify-center">
                  <SimulatedQrSvg
                    accent={method === "yape" ? "#742384" : "#008ba3"}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Número de prueba ({method.toUpperCase()})
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-base font-bold text-zinc-50 tracking-wider">
                      {TEST_PHONE}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                    >
                      {copiedPhone ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    Titular:{" "}
                    <span className="text-zinc-200">DetallesQR Studio</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Confirm Simulated Payment CTA */}
            <button
              type="button"
              disabled={isConfirming}
              onClick={handleConfirmPayment}
              className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando pago simulado...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>Ya realicé el pago • Confirmar</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-zinc-500">
              Modo demostración: haz clic en &ldquo;Confirmar&rdquo; para
              generar tu enlace dinámico y código QR al instante.
            </p>
          </div>
        ) : (
          /* Success State with Generated QR & Direct Link to /d/[slug] */
          <div className="p-6 text-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">
                ¡Tu Detalle QR está listo!
              </h2>
              <p className="text-xs text-zinc-400">
                Descarga o comparte el QR con{" "}
                <strong className="text-zinc-200">
                  {gift.recipientName.trim() || "tu persona favorita"}
                </strong>
              </p>
            </div>

            {/* Generated Gift QR Box */}
            <div className="mx-auto w-44 h-44 rounded-2xl bg-white p-3 shadow-xl flex flex-col items-center justify-center">
              <SimulatedQrSvg accent="#09090b" />
              <span className="mt-1.5 text-[9px] font-mono font-bold text-zinc-700 uppercase tracking-widest">
                SCAN ME • DETALLESQR
              </span>
            </div>

            {/* Dynamic Route Slug Box */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between gap-2 text-left">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Enlace único del destinatario
                </p>
                <p className="text-xs font-mono text-amber-300 truncate">
                  {sharePath}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Copiar URL</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <Link
                href={sharePath}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-950 flex items-center justify-center gap-1.5 shadow-lg hover:brightness-105 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Abrir Vista Destinatario</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-3 px-4 rounded-xl font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
              >
                Seguir editando
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SimulatedQrSvg({ accent }: { accent: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      fill={accent}
      role="img"
      aria-label="Código QR"
    >
      <title>Código QR</title>
      {/* Finder Patterns */}
      <path d="M8,8 h26 v26 h-26 z M13,13 v16 h16 v-16 z M17,17 h8 v8 h-8 z" />
      <path d="M66,8 h26 v26 h-26 z M71,13 v16 h16 v-16 z M75,17 h8 v8 h-8 z" />
      <path d="M8,66 h26 v26 h-26 z M13,71 v16 h16 v-16 z M17,75 h8 v8 h-8 z" />
      {/* Data Modules */}
      <rect x="40" y="10" width="6" height="6" />
      <rect x="52" y="10" width="6" height="12" />
      <rect x="40" y="22" width="6" height="12" />
      <rect x="48" y="28" width="10" height="6" />
      <rect x="10" y="42" width="12" height="6" />
      <rect x="28" y="42" width="6" height="14" />
      <rect x="42" y="42" width="16" height="16" rx="2" />
      <rect x="64" y="42" width="6" height="12" />
      <rect x="76" y="40" width="14" height="6" />
      <rect x="82" y="52" width="10" height="10" />
      <rect x="40" y="66" width="8" height="8" />
      <rect x="54" y="64" width="12" height="6" />
      <rect x="72" y="68" width="8" height="14" />
      <rect x="42" y="82" width="16" height="8" />
      <rect x="64" y="84" width="26" height="8" />
      <rect x="84" y="70" width="8" height="8" />
    </svg>
  );
}
