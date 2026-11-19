"use client";

import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileImage,
  History,
  Loader2,
  Phone,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import {
  type GiftData,
  getLastCreatedGiftFromStorage,
  normalizePhoneDigits,
  recoverGiftsByPhoneAndRecipient,
  saveGiftCloudOrLocal,
  THEMES,
} from "@/types/gift";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gift: GiftData;
  initialMode?: "pay" | "recover";
  canActivateNewQr?: boolean;
  onStartEditing?: () => void;
}

type PaymentMethod = "yape" | "plin";
type LocalHostChoice = "wifi" | "tailscale";

const TEST_PHONE = "938 985 009";
const TEST_PHONE_RAW = "938985009";

const WIFI_LOCAL_ORIGIN = "http://192.168.100.20:3000";
const TAILSCALE_ORIGIN = "http://100.92.45.3:3000";

export default function PaymentModal({
  isOpen,
  onClose,
  gift,
  initialMode = "pay",
  canActivateNewQr = true,
  onStartEditing,
}: PaymentModalProps) {
  const [modalTab, setModalTab] = useState<"pay" | "recover">(initialMode);
  const [method, setMethod] = useState<PaymentMethod>("yape");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedGift, setConfirmedGift] = useState<GiftData | null>(null);
  const [savedInCloud, setSavedInCloud] = useState(false);
  const [realQrDataUrl, setRealQrDataUrl] = useState<string | null>(null);
  const [isLocalhostEnv, setIsLocalhostEnv] = useState(false);
  const [hostChoice, setHostChoice] = useState<LocalHostChoice>("tailscale");

  // Recovery states
  const [lastLocalGift, setLastLocalGift] = useState<GiftData | null>(null);
  const [recoverPhone, setRecoverPhone] = useState("");
  const [recoverRecipient, setRecoverRecipient] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveredList, setRecoveredList] = useState<GiftData[]>([]);
  const [recoverError, setRecoverError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setModalTab(initialMode);
      setLastLocalGift(getLastCreatedGiftFromStorage());
      setRecoverError("");
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hostname;
      setIsLocalhostEnv(h === "localhost" || h === "127.0.0.1");
    }
  }, []);

  const confirmedSlug = confirmedGift?.slug || null;
  const displayGift = confirmedGift || gift;
  const sharePath = confirmedSlug ? `/d/${confirmedSlug}` : "";

  const getScannableFullUrl = () => {
    if (!confirmedSlug || typeof window === "undefined") return "";
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      const base =
        hostChoice === "tailscale" ? TAILSCALE_ORIGIN : WIFI_LOCAL_ORIGIN;
      return `${base}${sharePath}`;
    }
    return `${window.location.origin}${sharePath}`;
  };

  // Generate 100% REAL scannable QR code whenever confirmedSlug or hostChoice changes
  useEffect(() => {
    if (!confirmedSlug || typeof window === "undefined") {
      setRealQrDataUrl(null);
      return;
    }
    const targetUrl =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? `${hostChoice === "tailscale" ? TAILSCALE_ORIGIN : WIFI_LOCAL_ORIGIN}/d/${confirmedSlug}`
        : `${window.location.origin}/d/${confirmedSlug}`;

    QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
    })
      .then((url) => setRealQrDataUrl(url))
      .catch(() => setRealQrDataUrl(null));
  }, [confirmedSlug, hostChoice]);

  if (!isOpen) return null;

  const themeMeta = THEMES[displayGift.theme];

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
    const uniqueCode = Math.random().toString(36).substring(2, 6);
    return `${gift.theme}-${fromSlug}-para-${toSlug}-${uniqueCode}`;
  };

  const handleConfirmPayment = async () => {
    const cleanBuyerDigits = normalizePhoneDigits(buyerPhone);
    if (cleanBuyerDigits.length < 6) {
      setPhoneError(
        "Ingresa tu número de celular (mínimo 6 dígitos) para poder recuperar tu QR.",
      );
      return;
    }
    setPhoneError("");
    setIsConfirming(true);
    const finalSlug = buildSlug();
    const newGift: GiftData = {
      ...gift,
      slug: finalSlug,
      buyerPhone: cleanBuyerDigits,
    };
    const { savedToCloud } = await saveGiftCloudOrLocal(newGift);
    setSavedInCloud(savedToCloud);
    setLastLocalGift(newGift);
    setIsConfirming(false);
    setConfirmedGift(newGift);
  };

  const handleRecoverSearch = async () => {
    if (
      normalizePhoneDigits(recoverPhone).length < 6 &&
      recoverPhone.trim().length < 2
    ) {
      setRecoverError("Ingresa el número de celular con el que creaste el QR.");
      return;
    }
    if (recoverRecipient.trim().length < 2) {
      setRecoverError("Ingresa el nombre del destinatario (ej. Valentina).");
      return;
    }
    setRecoverError("");
    setIsRecovering(true);
    const found = await recoverGiftsByPhoneAndRecipient(
      recoverPhone,
      recoverRecipient,
    );
    setIsRecovering(false);
    setRecoveredList(found);
    if (found.length === 1) {
      // Open the single found gift directly on the QR download screen!
      setSavedInCloud(true);
      setConfirmedGift(found[0]);
    } else if (found.length === 0) {
      setRecoverError(
        "No encontramos un detalle con ese celular y destinatario. Verifica los datos.",
      );
    }
  };

  const handleCopyLink = async () => {
    if (!confirmedSlug || typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(getScannableFullUrl());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  /**
   * Downloads just the clean high-res QR code image (600x600 PNG)
   */
  const handleDownloadOnlyQr = () => {
    if (!realQrDataUrl || !confirmedSlug) return;
    const link = document.createElement("a");
    link.download = `QR-${confirmedSlug}.png`;
    link.href = realQrDataUrl;
    link.click();
  };

  /**
   * Generates and downloads a 1080x1350 HD luxury editorial printable gift card with the real QR code
   */
  const handleDownloadPrintableCard = () => {
    if (!realQrDataUrl || !confirmedSlug) return;

    const qrImg = new window.Image();
    qrImg.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const palette =
        displayGift.theme === "hotwheels"
          ? {
              bgTop: "#061326",
              bgMid: "#0b192c",
              bgBot: "#05070b",
              glowA: "rgba(56, 189, 248, 0.22)",
              glowB: "rgba(249, 115, 22, 0.18)",
              gold: "#fb923c",
              goldSoft: "rgba(251, 146, 60, 0.38)",
              cream: "#f8fafc",
              subtitle: "EDICIÓN LIMITADA • COLECCIÓN PRIVADA",
            }
          : displayGift.theme === "flores"
            ? {
                bgTop: "#1f1206",
                bgMid: "#140d06",
                bgBot: "#080604",
                glowA: "rgba(250, 204, 21, 0.22)",
                glowB: "rgba(245, 158, 11, 0.15)",
                gold: "#eab308",
                goldSoft: "rgba(234, 179, 8, 0.38)",
                cream: "#fef9c3",
                subtitle: "PRIMAVERA ETERNA • DETALLE EXCLUSIVO",
              }
            : {
                bgTop: "#260713",
                bgMid: "#16050c",
                bgBot: "#080406",
                glowA: "rgba(244, 63, 94, 0.24)",
                glowB: "rgba(251, 113, 133, 0.14)",
                gold: "#fda4af",
                goldSoft: "rgba(253, 164, 175, 0.38)",
                cream: "#fff1f2",
                subtitle: "NUESTRA HISTORIA • EDICIÓN ESPECIAL",
              };

      // 1. Deep Velvet Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
      bgGrad.addColorStop(0, palette.bgTop);
      bgGrad.addColorStop(0.5, palette.bgMid);
      bgGrad.addColorStop(1, palette.bgBot);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1350);

      // 2. Soft Radial Ambient Spotlights
      const topGlow = ctx.createRadialGradient(540, 240, 20, 540, 240, 520);
      topGlow.addColorStop(0, palette.glowA);
      topGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, 1080, 1350);

      const centerGlow = ctx.createRadialGradient(540, 720, 40, 540, 720, 480);
      centerGlow.addColorStop(0, palette.glowB);
      centerGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, 1080, 1350);

      // Subtle Golden Stardust Dots
      const dustCoords = [
        [140, 180, 2.2],
        [930, 195, 2.5],
        [185, 520, 1.8],
        [895, 490, 2.0],
        [150, 940, 2.4],
        [920, 960, 1.9],
        [240, 1160, 1.6],
        [840, 1140, 2.1],
      ];
      ctx.fillStyle = palette.goldSoft;
      for (const [dx, dy, dr] of dustCoords) {
        ctx.beginPath();
        ctx.arc(dx, dy, dr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Double Luxury Editorial Frame + Corner Diamonds
      ctx.strokeStyle = palette.goldSoft;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(46, 46, 988, 1258, 36);
      ctx.stroke();

      ctx.strokeStyle = palette.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(68, 68, 944, 1214, 26);
      ctx.stroke();

      // Corner Ornamental Diamonds
      const drawDiamond = (cx: number, cy: number, size: number) => {
        ctx.fillStyle = palette.gold;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size, cy);
        ctx.closePath();
        ctx.fill();
      };
      drawDiamond(96, 96, 7);
      drawDiamond(984, 96, 7);
      drawDiamond(96, 1254, 7);
      drawDiamond(984, 1254, 7);

      // 4. Editorial Header & Recipient Typography
      ctx.fillStyle = palette.gold;
      ctx.font = "600 21px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`❖   ${palette.subtitle}   ❖`, 540, 145);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = "500 22px Georgia, serif";
      ctx.fillText("U N   D E T A L L E   E S P E C I A L   P A R A", 540, 205);

      const recipient = (
        displayGift.recipientName.trim() || "Persona Especial"
      ).slice(0, 24);
      ctx.fillStyle = palette.cream;
      ctx.font = "italic bold 74px Georgia, serif";
      ctx.fillText(recipient, 540, 290);

      // Ornamental Divider under Name
      ctx.strokeStyle = palette.goldSoft;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(310, 328);
      ctx.lineTo(512, 328);
      ctx.moveTo(568, 328);
      ctx.lineTo(770, 328);
      ctx.stroke();
      drawDiamond(540, 328, 6);

      ctx.fillStyle = "#d4d4d8";
      ctx.font = "italic 29px Georgia, serif";
      ctx.fillText(
        "“Hay momentos que merecen guardarse para siempre”",
        540,
        378,
      );

      // 5. Boutique Double-Matted Pedestal for QR Code
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 45;
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = "#fcfaf5";
      ctx.beginPath();
      ctx.roundRect(230, 425, 620, 650, 38);
      ctx.fill();
      ctx.restore();

      // Inner Gold Border inside Ivory Pedestal
      ctx.strokeStyle = palette.gold;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(252, 447, 576, 606, 26);
      ctx.stroke();

      // Draw Real Scannable QR Code
      ctx.drawImage(qrImg, 285, 472, 510, 510);

      // Elegant Pill inside Pedestal Bottom
      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      ctx.roundRect(335, 990, 410, 44, 22);
      ctx.fill();

      ctx.fillStyle = palette.gold;
      ctx.font = "bold 19px system-ui, -apple-system, sans-serif";
      ctx.fillText("ESCANÉAME CON TU CÁMARA", 540, 1019);

      // 6. Calligraphic Footer & Sender Signature
      ctx.fillStyle = "#e4e4e7";
      ctx.font = "italic 28px Georgia, serif";
      ctx.fillText(
        "Sube el volumen de tu celular para vivir la experiencia completa 🎵",
        540,
        1135,
      );

      const sender = (
        displayGift.senderName.trim() || "Alguien que te quiere"
      ).slice(0, 28);
      ctx.fillStyle = palette.cream;
      ctx.font = "italic bold 42px Georgia, serif";
      ctx.fillText(`Con todo mi cariño, ${sender}`, 540, 1198);

      // Bottom Seal
      ctx.fillStyle = palette.goldSoft;
      ctx.font = "600 18px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        `DETALLESQR  •  HISTORIA DESDE ${displayGift.startDate || "HOY"}`,
        540,
        1252,
      );

      // Trigger PNG download
      const link = document.createElement("a");
      link.download = `Tarjeta-QR-${confirmedSlug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    qrImg.src = realQrDataUrl;
  };

  const handleResetAndClose = () => {
    setConfirmedGift(null);
    setIsConfirming(false);
    setRealQrDataUrl(null);
    setRecoveredList([]);
    setRecoverError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden text-zinc-100 max-h-[92vh] overflow-y-auto no-scrollbar">
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
            {/* Top Mode Switcher: New Payment vs Recover Existing QR */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 mr-8">
              <button
                type="button"
                onClick={() => setModalTab("pay")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === "pay"
                    ? "bg-zinc-800 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Activar Nuevo QR</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("recover")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === "recover"
                    ? "bg-zinc-800 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recuperar mi QR</span>
              </button>
            </div>

            {modalTab === "pay" ? (
              !canActivateNewQr ? (
                /* Guard when user hasn't started editing a gift yet */
                <div className="py-5 px-3 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                    <Wand2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>Paso previo requerido</span>
                    </span>
                    <h2
                      id="payment-modal-title"
                      className="text-xl font-bold text-zinc-50"
                    >
                      Primero personaliza tu detalle
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      Aún no has editado ningún detalle. Elige tu temática,
                      escribe tu dedicatoria, sube tu foto y selecciona tu
                      canción favorita antes de realizar el pago y generar tu
                      código QR.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-3.5 text-left space-y-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        1. Elige temática (Hot Wheels, Flores, Aniversario)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        2. Agrega nombres, fecha, foto y fragmento musical
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>3. Activa tu QR real y descarga tu tarjeta HD</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleResetAndClose();
                        onStartEditing?.();
                      }}
                      className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-zinc-950 shadow-lg shadow-orange-500/20 hover:brightness-105 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Ir a Personalizar mi Detalle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalTab("recover")}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    >
                      ¿Ya compraste uno antes? Volver a Recuperar mi QR →
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="space-y-1">
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

                    {/* Simulated Merchant QR + Phone Details */}
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
                          <span className="text-zinc-200">
                            DetallesQR Studio
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Buyer Phone Input (Unique Recovery Key!) */}
                  <div className="space-y-1.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 p-3.5">
                    <label
                      htmlFor="buyerPhoneInput"
                      className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Tu número de celular (Para recuperar tu QR cuando
                        quieras)
                      </span>
                    </label>
                    <input
                      id="buyerPhoneInput"
                      type="tel"
                      maxLength={15}
                      value={buyerPhone}
                      onChange={(e) => {
                        setBuyerPhone(e.target.value);
                        if (phoneError) setPhoneError("");
                      }}
                      placeholder="Ej. 987 654 321"
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
                    />
                    {phoneError ? (
                      <p className="text-[11px] text-rose-400 font-medium">
                        ⚠️ {phoneError}
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-500">
                        Si cierras esta ventana por error, con tu celular y el
                        nombre de tu pareja podrás volver a descargar tu QR.
                      </p>
                    )}
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
                        <span>Guardando y generando QR real...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>Ya realicé el pago • Confirmar</span>
                      </>
                    )}
                  </button>
                </>
              )
            ) : (
              /* RECOVERY TAB: Auto-saved local gift + Supabase Phone + Recipient Search */
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-zinc-50">
                    Recupera tu Código QR
                  </h2>
                  <p className="text-xs text-zinc-400">
                    ¿Saliste por error o cambiaste de celular? Recupera tu
                    enlace y tarjeta imprimible al instante.
                  </p>
                </div>

                {/* Layer 1: Instant Local Device Cache */}
                {lastLocalGift && (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/35 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                        <History className="w-3.5 h-3.5" />
                        <span>Guardado en este navegador</span>
                      </span>
                      <span className="text-sm">
                        {THEMES[lastLocalGift.theme].emoji}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {lastLocalGift.senderName} →{" "}
                          {lastLocalGift.recipientName}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-400 truncate">
                          /d/{lastLocalGift.slug}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSavedInCloud(true);
                          setConfirmedGift(lastLocalGift);
                        }}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Ver mi QR
                      </button>
                    </div>
                  </div>
                )}

                {/* Layer 2: Cloud Search by Buyer Phone + Recipient Name */}
                <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3.5">
                  <p className="text-xs font-semibold text-zinc-300">
                    🔍 Buscar en la base de datos (Desde cualquier dispositivo):
                  </p>

                  <div className="space-y-1">
                    <label
                      htmlFor="recoverPhoneInput"
                      className="text-[11px] font-medium text-zinc-400"
                    >
                      1. Número de celular con el que lo creaste
                    </label>
                    <input
                      id="recoverPhoneInput"
                      type="text"
                      value={recoverPhone}
                      onChange={(e) => setRecoverPhone(e.target.value)}
                      placeholder="Ej. 987 654 321"
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="recoverRecipientInput"
                      className="text-[11px] font-medium text-zinc-400"
                    >
                      2. Nombre del destinatario (tu pareja)
                    </label>
                    <input
                      id="recoverRecipientInput"
                      type="text"
                      value={recoverRecipient}
                      onChange={(e) => setRecoverRecipient(e.target.value)}
                      placeholder="Ej. Valentina o Paula"
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    />
                  </div>

                  {recoverError && (
                    <p className="text-[11px] text-rose-400 font-medium">
                      ⚠️ {recoverError}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={isRecovering}
                    onClick={handleRecoverSearch}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isRecovering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Buscando en Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Buscar y Recuperar mi QR</span>
                      </>
                    )}
                  </button>

                  {/* If multiple gifts matched for that phone + recipient */}
                  {recoveredList.length > 1 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        Encontramos {recoveredList.length} detalles. Elige cuál
                        abrir:
                      </p>
                      {recoveredList.map((item) => (
                        <div
                          key={item.slug}
                          className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {THEMES[item.theme].emoji} {item.senderName} →{" "}
                              {item.recipientName}
                            </p>
                            <p className="text-[10px] font-mono text-zinc-400 truncate">
                              /d/{item.slug}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSavedInCloud(true);
                              setConfirmedGift(item);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-[11px] shrink-0 cursor-pointer"
                          >
                            Abrir QR
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Success State with 100% REAL Scannable QR & Printable Card Download */
          <div className="p-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">
                ¡Tu Código QR Real está listo!
              </h2>
              <p className="text-xs text-zinc-400">
                Escanéalo con la cámara de tu celular o descárgalo para{" "}
                <strong className="text-zinc-200">
                  {displayGift.recipientName.trim() || "tu persona favorita"}
                </strong>
              </p>
              {savedInCloud && (
                <p className="text-[11px] font-semibold text-emerald-400 pt-0.5">
                  ☁️ Guardado en Supabase • Disponible en cualquier celular
                </p>
              )}
            </div>

            {/* If testing on localhost, allow switching QR IP between Tailscale & Wi-Fi so phone camera scan works! */}
            {isLocalhostEnv && (
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px]">
                <span className="text-zinc-400 px-2">Red para escanear:</span>
                <button
                  type="button"
                  onClick={() => setHostChoice("tailscale")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    hostChoice === "tailscale"
                      ? "bg-amber-400 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Tailscale (100.92.45.3)
                </button>
                <button
                  type="button"
                  onClick={() => setHostChoice("wifi")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    hostChoice === "wifi"
                      ? "bg-amber-400 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Wi-Fi (192.168.100.20)
                </button>
              </div>
            )}

            {/* REAL Scannable Gift QR Box */}
            <div className="mx-auto w-48 h-48 rounded-2xl bg-white p-2.5 shadow-xl flex flex-col items-center justify-center">
              {realQrDataUrl ? (
                <div className="relative w-36 h-36">
                  <Image
                    src={realQrDataUrl}
                    alt={`Código QR para ${gift.recipientName}`}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              ) : (
                <SimulatedQrSvg accent="#09090b" />
              )}
              <span className="mt-1 text-[9px] font-mono font-bold text-zinc-800 uppercase tracking-widest">
                ESCANÉAME • {themeMeta.name.toUpperCase()}
              </span>
            </div>

            {/* Download Buttons: Printable Card HD + Only QR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPrintableCard}
                className="py-2.5 px-3.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <FileImage className="w-4 h-4" />
                <span>Descargar Tarjetita QR (HD)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadOnlyQr}
                className="py-2.5 px-3.5 rounded-xl font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Solo QR (PNG)</span>
              </button>
            </div>

            {/* Dynamic Route Slug Box */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between gap-2 text-left">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  URL codificada en el QR
                </p>
                <p className="text-xs font-mono text-amber-300 truncate">
                  {getScannableFullUrl()}
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
