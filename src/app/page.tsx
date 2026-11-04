"use client";

import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Gift,
  Heart,
  ImagePlus,
  LockOpen,
  MessageSquareHeart,
  Music2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  User,
  Wand2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import PaymentModal from "@/components/PaymentModal";
import PhoneMockup from "@/components/PhoneMockup";
import {
  calculateDaysTogether,
  type GiftData,
  THEME_LIST,
  THEMES,
  type ThemeId,
} from "@/types/gift";

/**
 * Compresses a selected local image file to a lightweight JPEG data URL
 * so previewing is instant and saving to localStorage for /d/[slug] works smoothly.
 */
function readAndCompressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error al leer imagen"));
    reader.onload = () => {
      const result = reader.result as string;
      const img = new window.Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const MAX_SIDE = 900;
        let { width, height } = img;
        if (width > MAX_SIDE || height > MAX_SIDE) {
          if (width > height) {
            height = Math.round((height * MAX_SIDE) / width);
            width = MAX_SIDE;
          } else {
            width = Math.round((width * MAX_SIDE) / height);
            height = MAX_SIDE;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

interface WizardStepMeta {
  id: number;
  shortTitle: string;
  title: string;
  subtitle: string;
}

const WIZARD_STEPS: WizardStepMeta[] = [
  {
    id: 1,
    shortTitle: "Temática",
    title: "¿Qué estilo tendrá tu detalle?",
    subtitle:
      "Elige la temática viral que mejor conecte con tu persona favorita. La tarjeta de la derecha cambiará al instante.",
  },
  {
    id: 2,
    shortTitle: "Nombres",
    title: "¿De quién y para quién es?",
    subtitle:
      "Personaliza los protagonistas de esta historia para la pantalla de bloqueo y la firma de la tarjeta.",
  },
  {
    id: 3,
    shortTitle: "Dedicatoria",
    title: "Escribe un mensaje inolvidable",
    subtitle:
      "Dedícale unas palabras desde el corazón o inspírate con nuestras frases sugeridas según la temática.",
  },
  {
    id: 4,
    shortTitle: "Foto y Fecha",
    title: "Sube su mejor foto y fecha especial",
    subtitle:
      "Añade la fotografía central, el día en que empezó su historia para el contador y su canción especial.",
  },
  {
    id: 5,
    shortTitle: "Listo",
    title: "¡Todo listo para generar tu QR!",
    subtitle:
      "Revisa los datos de tu creación junto a la vista previa interactiva y activa tu enlace único.",
  },
];

export default function BuilderDashboardPage() {
  // Controls whether the user is on the Home Landing presentation or inside the Builder Wizard
  const [viewMode, setViewMode] = useState<"home" | "builder">("home");
  const [currentStep, setCurrentStep] = useState(1);

  const [theme, setTheme] = useState<ThemeId>("hotwheels");
  const [senderName, setSenderName] = useState("Mateo");
  const [recipientName, setRecipientName] = useState("Valentina");
  const [message, setMessage] = useState(THEMES.hotwheels.defaultMessage);
  const [hasCustomMessage, setHasCustomMessage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("2024-09-21");
  const [songTitle, setSongTitle] = useState(THEMES.hotwheels.defaultSong);
  const [hasCustomSong, setHasCustomSong] = useState(false);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [nowTimestamp, setNowTimestamp] = useState<number | undefined>(
    undefined,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNowTimestamp(Date.now());
  }, []);

  const handleSelectTheme = (nextTheme: ThemeId) => {
    setTheme(nextTheme);
    if (!hasCustomMessage) {
      setMessage(THEMES[nextTheme].defaultMessage);
    }
    if (!hasCustomSong) {
      setSongTitle(THEMES[nextTheme].defaultSong);
    }
  };

  const handleStartBuilding = (initialTheme?: ThemeId, startAtStep = 1) => {
    if (initialTheme) {
      handleSelectTheme(initialTheme);
    }
    setCurrentStep(startAtStep);
    setViewMode("builder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
    try {
      const dataUrl = await readAndCompressImage(file);
      setImageUrl(dataUrl);
    } catch {
      // Ignore invalid file read
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const currentGift: GiftData = {
    slug: "vista-previa",
    theme,
    senderName,
    recipientName,
    message,
    imageUrl,
    startDate,
    songTitle,
  };

  const daysTogether = calculateDaysTogether(startDate, nowTimestamp);
  const activeThemeMeta = THEMES[theme];
  const stepMeta = WIZARD_STEPS[currentStep - 1];
  const totalSteps = WIZARD_STEPS.length;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  const goNext = () => {
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Top SaaS Navbar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode("home")}
              className="flex items-center gap-3 text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-zinc-950 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">
                    Detalles<span className="text-amber-400">QR</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    SaaS Studio
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  Micro-detalles digitales virales listos para regalar
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {viewMode === "builder" ? (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode("home")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Inicio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-zinc-950 shadow-lg shadow-orange-500/20 hover:brightness-105 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Activar QR ({activeThemeMeta.pricePen})</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/d/demo-hotwheels"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Demo Real</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleStartBuilding()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-zinc-950 shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Crear Detalle</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* VIEW 1: HOME / LANDING PRESENTATION                       */}
      {/* ========================================================= */}
      {viewMode === "home" ? (
        <main className="flex-1 animate-in fade-in duration-500">
          {/* HERO SECTION */}
          <section className="relative overflow-hidden py-10 sm:py-16 lg:py-20 border-b border-zinc-900">
            {/* Ambient background glows */}
            <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute top-32 right-1/4 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Hero Copy */}
                <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      El complemento perfecto para tus regalos físicos
                    </span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                    Sorprende con un{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500">
                      micro-detalle digital
                    </span>{" "}
                    al escanear un QR
                  </h1>

                  <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                    Convierte un carrito Hot Wheels, un ramo de Flores Amarillas
                    o un regalo de aniversario en una experiencia interactiva
                    con su foto favorita, música especial, dedicatoria y un
                    contador en vivo de los días que llevan juntos.
                  </p>

                  {/* Primary & Secondary CTAs */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleStartBuilding()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-zinc-950 shadow-xl shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Gift className="w-5 h-5 stroke-[2.5]" />
                      <span>Crear Detalle Ahora</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <Link
                      href="/d/demo-hotwheels"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-colors"
                    >
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      <span>Probar experiencia del destinatario</span>
                    </Link>
                  </div>

                  {/* Quick Trust Badges */}
                  <div className="pt-4 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 border-t border-zinc-900 text-left">
                    <div>
                      <p className="text-lg font-black text-white">60 seg</p>
                      <p className="text-xs text-zinc-500">
                        Para personalizarlo
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-amber-400">
                        {activeThemeMeta.pricePen}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Pago único Yape / Plin
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-emerald-400">
                        100% QR
                      </p>
                      <p className="text-xs text-zinc-500">Sin instalar apps</p>
                    </div>
                  </div>
                </div>

                {/* Right Hero Interactive Phone Showcase */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="mb-3 flex items-center gap-1.5 text-xs text-zinc-400">
                    <span>Prueba cambiar de temática en vivo:</span>
                    {THEME_LIST.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectTheme(item.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          theme === item.id
                            ? "bg-zinc-100 text-zinc-950 border-white shadow"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        {item.emoji} {item.name}
                      </button>
                    ))}
                  </div>
                  <PhoneMockup gift={currentGift} />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: WHAT YOU WILL FIND / 3 VIRAL THEMES */}
          <section className="py-16 sm:py-20 border-b border-zinc-900 bg-zinc-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Catálogo de Experiencias
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  ¿Qué encontrarás en DetallesQR?
                </h2>
                <p className="text-sm sm:text-base text-zinc-400">
                  Tres diseños coleccionables pensados para las fechas más
                  especiales. Elige tu favorito y personalízalo paso a paso.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {THEME_LIST.map((item) => {
                  const cardStyle =
                    item.id === "hotwheels"
                      ? "from-sky-950/50 via-zinc-900 to-zinc-950 border-sky-500/30 hover:border-orange-500/60"
                      : item.id === "flores"
                        ? "from-amber-950/40 via-zinc-900 to-zinc-950 border-amber-500/30 hover:border-amber-400/60"
                        : "from-rose-950/40 via-zinc-900 to-zinc-950 border-rose-500/30 hover:border-rose-400/60";

                  return (
                    <div
                      key={item.id}
                      className={`rounded-3xl bg-gradient-to-b border p-6 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-xl ${cardStyle}`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-4xl">{item.emoji}</span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-950/80 border border-zinc-800 text-zinc-300">
                            {item.pricePen}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            Estilo {item.name}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-1">
                            {item.tagline}
                          </p>
                        </div>
                        <p className="text-xs font-serif italic text-zinc-300 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 leading-relaxed">
                          “{item.defaultMessage}”
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartBuilding(item.id, 2)}
                        className="mt-6 w-full py-3 px-4 rounded-xl font-bold text-xs bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <span>Crear con temática {item.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 3: INCLUDED FEATURES & HOW IT WORKS */}
          <section className="py-16 sm:py-20 bg-zinc-900/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
                  Experiencia Interactiva Completa
                </span>
                <h2 className="text-3xl font-bold text-white">
                  Todo lo que incluye cada detalle digital
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center">
                    <LockOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">
                    Splash de Intriga
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Al escanear el QR aparece una pantalla animada diciendo{" "}
                    <em>“Tienes un detalle especial”</em> antes de revelar la
                    sorpresa.
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">
                    Contador de Días Juntos
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Calcula automáticamente cuántos días llevan compartiendo
                    desde su fecha especial y se actualiza cada día.
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                    <Music2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">
                    Reproductor Musical
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Desbloquea un acorde de bienvenida con barras de ecualizador
                    animadas y el título de su canción favorita.
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-5 space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">
                    Activación con Yape o Plin
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Genera tu código QR listo para descargar, imprimir en
                    tarjetas de regalo o compartir por WhatsApp al instante.
                  </p>
                </div>
              </div>

              {/* Bottom Final CTA Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-400/30 p-8 sm:p-10 text-center space-y-5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>¿Listo para sorprender a tu persona favorita?</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white max-w-xl mx-auto">
                  Diseña tu tarjeta personalizada ahora y mira cómo queda en
                  tiempo real
                </h3>
                <button
                  type="button"
                  onClick={() => handleStartBuilding()}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-zinc-950 shadow-xl shadow-orange-500/25 hover:scale-105 transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Crear Detalle</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* ========================================================= */
        /* VIEW 2: INTERACTIVE MULTI-STEP BUILDER WIZARD             */
        /* ========================================================= */
        <>
          {/* Mobile Segmented Switcher (Editor vs Celular Preview) */}
          <div className="lg:hidden sticky top-16 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 px-4 py-2.5">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setMobileTab("editor")}
                className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mobileTab === "editor"
                    ? "bg-zinc-100 text-zinc-950 shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ✏️ Paso {currentStep} de {totalSteps}
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mobileTab === "preview"
                    ? "bg-zinc-100 text-zinc-950 shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Vista Previa Celular</span>
              </button>
            </div>
          </div>

          {/* Main Split Workspace */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* LEFT COLUMN: Dynamic Multi-Step Wizard Window */}
              <section
                className={`lg:col-span-7 flex flex-col justify-center ${
                  mobileTab === "preview" ? "hidden lg:flex" : "flex"
                }`}
              >
                {/* Wizard Container Card */}
                <div className="rounded-[32px] bg-zinc-900/75 border border-zinc-800/90 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl">
                  {/* Top Stepper Bar */}
                  <div className="p-5 sm:px-8 sm:pt-7 sm:pb-5 border-b border-zinc-800/80 bg-zinc-950/50 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          Paso {currentStep} de {totalSteps}
                        </span>
                      </div>

                      <span className="text-xs font-mono text-zinc-400">
                        {progressPercent}% completado
                      </span>
                    </div>

                    {/* Interactive Step Pills */}
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                      {WIZARD_STEPS.map((step) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        return (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => setCurrentStep(step.id)}
                            className={`group flex flex-col items-start gap-1.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              isActive
                                ? "bg-zinc-900 border-amber-400/60 shadow-sm"
                                : isCompleted
                                  ? "bg-zinc-900/40 border-emerald-500/30 hover:border-emerald-500/50"
                                  : "bg-zinc-950/40 border-zinc-800/70 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                                  isActive
                                    ? "bg-amber-400 text-zinc-950"
                                    : isCompleted
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                      : "bg-zinc-800 text-zinc-400"
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                ) : (
                                  step.id
                                )}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-semibold truncate w-full ${
                                isActive
                                  ? "text-zinc-100"
                                  : isCompleted
                                    ? "text-zinc-300"
                                    : "text-zinc-500"
                              }`}
                            >
                              {step.shortTitle}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Smooth Progress Line */}
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Step Window Content */}
                  <div
                    key={currentStep}
                    className="p-6 sm:p-8 min-h-[370px] flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300"
                  >
                    <div className="space-y-6">
                      {/* Step Title & Subtitle */}
                      <div className="space-y-1.5">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                          {stepMeta.title}
                        </h1>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          {stepMeta.subtitle}
                        </p>
                      </div>

                      {/* STEP 1: Theme Selection */}
                      {currentStep === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                          {THEME_LIST.map((item) => {
                            const isSelected = theme === item.id;
                            const activeBorder =
                              item.id === "hotwheels"
                                ? "border-orange-500 bg-gradient-to-b from-sky-950/70 to-orange-950/35 shadow-xl shadow-orange-500/15 scale-[1.01]"
                                : item.id === "flores"
                                  ? "border-amber-400 bg-gradient-to-b from-amber-950/60 to-zinc-900 shadow-xl shadow-amber-400/15 scale-[1.01]"
                                  : "border-rose-500 bg-gradient-to-b from-rose-950/60 to-zinc-900 shadow-xl shadow-rose-500/15 scale-[1.01]";

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectTheme(item.id)}
                                className={`relative text-left rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? activeBorder
                                    : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900"
                                }`}
                              >
                                {isSelected && (
                                  <span className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </span>
                                )}
                                <span
                                  className="text-4xl block mb-3"
                                  role="img"
                                  aria-label={item.name}
                                >
                                  {item.emoji}
                                </span>
                                <p className="font-bold text-base text-zinc-100">
                                  {item.name}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                                  {item.tagline}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* STEP 2: Sender & Recipient Names */}
                      {currentStep === 2 && (
                        <div className="space-y-5 pt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-4">
                              <label
                                htmlFor="senderName"
                                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
                              >
                                <User className="w-3.5 h-3.5 text-amber-400" />
                                <span>¿Quién envía el detalle? (Tú)</span>
                              </label>
                              <input
                                id="senderName"
                                type="text"
                                maxLength={40}
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder="Ej. Mateo"
                                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-base font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                              />
                              <p className="text-[11px] text-zinc-500">
                                Aparecerá en la firma y en la pantalla de
                                intriga.
                              </p>
                            </div>

                            <div className="space-y-2 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 p-4">
                              <label
                                htmlFor="recipientName"
                                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                                <span>¿Para quién es? (Destinatario)</span>
                              </label>
                              <input
                                id="recipientName"
                                type="text"
                                maxLength={40}
                                value={recipientName}
                                onChange={(e) =>
                                  setRecipientName(e.target.value)
                                }
                                placeholder="Ej. Valentina"
                                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-base font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                              />
                              <p className="text-[11px] text-zinc-500">
                                Protagonista del encabezado de la tarjeta.
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 flex items-center justify-between text-xs text-amber-200/90">
                            <span>
                              💡 Mira el celular a la derecha: ya dice{" "}
                              <strong>
                                {senderName.trim() || "Remitente"} &amp;{" "}
                                {recipientName.trim() || "Destinatario"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: Dedication Message */}
                      {currentStep === 3 && (
                        <div className="space-y-4 pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label
                              htmlFor="dedicationMessage"
                              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
                            >
                              <MessageSquareHeart className="w-4 h-4 text-rose-400" />
                              <span>Tu Dedicatoria Personalizada</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setMessage(activeThemeMeta.defaultMessage);
                                setHasCustomMessage(false);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-semibold text-amber-300 transition-colors cursor-pointer"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>
                                Usar frase sugerida ({activeThemeMeta.name})
                              </span>
                            </button>
                          </div>

                          <textarea
                            id="dedicationMessage"
                            rows={5}
                            maxLength={260}
                            value={message}
                            onChange={(e) => {
                              setMessage(e.target.value);
                              setHasCustomMessage(true);
                            }}
                            placeholder="Escribe aquí unas palabras especiales..."
                            className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-base font-serif italic text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all resize-none leading-relaxed"
                          />

                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>
                              Se muestra con tipografía elegante en la tarjeta.
                            </span>
                            <span className="tabular-nums font-mono">
                              {message.length}/260 caracteres
                            </span>
                          </div>
                        </div>
                      )}

                      {/* STEP 4: Local Photo, Start Date & Song */}
                      {currentStep === 4 && (
                        <div className="space-y-5 pt-1">
                          {/* Local Image Picker */}
                          <div className="space-y-2">
                            <label
                              htmlFor="photoUpload"
                              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
                            >
                              <ImagePlus className="w-3.5 h-3.5 text-sky-400" />
                              <span>Fotografía Principal</span>
                            </label>

                            <input
                              ref={fileInputRef}
                              id="photoUpload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="sr-only"
                            />

                            {!imageUrl ? (
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full rounded-2xl border-2 border-dashed border-zinc-800 hover:border-amber-400/50 bg-zinc-950/70 hover:bg-zinc-950 p-5 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
                              >
                                <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-amber-400/40 flex items-center justify-center text-zinc-400 group-hover:text-amber-300 transition-colors">
                                  <ImagePlus className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-semibold text-zinc-200">
                                    Subir foto desde tu celular o PC
                                  </p>
                                  <p className="text-xs text-zinc-500 mt-0.5">
                                    JPG, PNG o WEBP • Se encuadra
                                    automáticamente en la tarjeta
                                  </p>
                                </div>
                              </button>
                            ) : (
                              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-700">
                                    <Image
                                      src={imageUrl}
                                      alt="Vista previa miniatura"
                                      fill
                                      unoptimized
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-zinc-100 truncate">
                                      {imageFileName ||
                                        "Foto personalizada cargada"}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        fileInputRef.current?.click()
                                      }
                                      className="text-xs text-amber-400 hover:underline mt-1 cursor-pointer"
                                    >
                                      Cambiar fotografía
                                    </button>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  aria-label="Quitar fotografía"
                                  className="p-2.5 rounded-xl bg-zinc-900 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Start Date & Song Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label
                                  htmlFor="startDate"
                                  className="text-xs font-medium text-zinc-300 flex items-center gap-1.5"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Fecha de inicio juntos</span>
                                </label>
                                <span className="text-xs font-bold text-emerald-400 tabular-nums">
                                  {daysTogether} días
                                </span>
                              </div>
                              <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all [color-scheme:dark]"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label
                                htmlFor="songTitle"
                                className="text-xs font-medium text-zinc-300 flex items-center gap-1.5"
                              >
                                <Music2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>Canción especial (Simulada)</span>
                              </label>
                              <input
                                id="songTitle"
                                type="text"
                                maxLength={60}
                                value={songTitle}
                                onChange={(e) => {
                                  setSongTitle(e.target.value);
                                  setHasCustomSong(true);
                                }}
                                placeholder="Nombre de su canción..."
                                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 5: Final Summary & Checkout Trigger */}
                      {currentStep === 5 && (
                        <div className="space-y-5 pt-1">
                          <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800 p-5 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">
                                  {activeThemeMeta.emoji}
                                </span>
                                <div>
                                  <p className="text-xs text-zinc-400">
                                    Temática seleccionada
                                  </p>
                                  <p className="text-sm font-bold text-white">
                                    {activeThemeMeta.name}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="text-xs text-amber-400 hover:underline cursor-pointer"
                              >
                                Cambiar
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60">
                                <span className="text-zinc-500 block">
                                  De / Para
                                </span>
                                <span className="font-semibold text-zinc-100 mt-0.5 block truncate">
                                  {senderName || "Mateo"} →{" "}
                                  {recipientName || "Valentina"}
                                </span>
                              </div>
                              <div className="rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60">
                                <span className="text-zinc-500 block">
                                  Contador activo
                                </span>
                                <span className="font-semibold text-emerald-400 mt-0.5 block">
                                  {daysTogether} días juntos ({startDate})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-2 text-xs text-emerald-400">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>
                                  Incluye Splash de apertura + Audio + QR listo
                                  para compartir
                                </span>
                              </div>
                              <span className="text-lg font-black text-white shrink-0">
                                {activeThemeMeta.pricePen}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsPaymentOpen(true)}
                            className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-zinc-950 shadow-xl shadow-orange-500/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                          >
                            <QrCode className="w-5 h-5 stroke-[2.5]" />
                            <span>
                              Pagar con Yape / Plin ({activeThemeMeta.pricePen})
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Wizard Footer Navigation (Anterior / Siguiente) */}
                    <div className="mt-8 pt-5 border-t border-zinc-800/80 flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={goPrev}
                        disabled={currentStep === 1}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-300 disabled:opacity-35 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </button>

                      {currentStep < totalSteps ? (
                        <button
                          type="button"
                          onClick={goNext}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-zinc-100 hover:bg-white text-zinc-950 shadow-lg transition-all hover:translate-x-0.5 cursor-pointer"
                        >
                          <span>
                            Siguiente:{" "}
                            {WIZARD_STEPS[currentStep]?.shortTitle ||
                              "Continuar"}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsPaymentOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Confirmar y Generar QR</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* RIGHT COLUMN: Sticky Interactive iPhone Preview (Always visible on desktop!) */}
              <aside
                className={`lg:col-span-5 lg:sticky lg:top-24 ${
                  mobileTab === "editor" ? "hidden lg:block" : "block"
                }`}
              >
                <PhoneMockup gift={currentGift} />
              </aside>
            </div>
          </main>
        </>
      )}

      {/* Simulated Yape / Plin Checkout Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        gift={currentGift}
      />
    </div>
  );
}
