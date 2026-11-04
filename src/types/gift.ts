export type ThemeId = "hotwheels" | "flores" | "aniversario";

export interface GiftData {
  slug: string;
  theme: ThemeId;
  senderName: string;
  recipientName: string;
  message: string;
  imageUrl: string | null;
  startDate: string; // YYYY-MM-DD
  songTitle?: string;
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  emoji: string;
  tagline: string;
  badgeText: string;
  defaultSong: string;
  defaultMessage: string;
  accentGradient: string;
  ringColor: string;
  pricePen: string;
  defaultImageSvg: string;
}

// Crisp inline SVG data URIs so every theme has an attractive default visual immediately
const HOTWHEELS_DEFAULT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c4a6e"/>
      <stop offset="55%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="car" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="50%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <path d="M-50 430 L650 310 L650 360 L-50 480 Z" fill="#f97316" opacity="0.25"/>
  <path d="M-50 490 L650 370 L650 395 L-50 515 Z" fill="#facc15" opacity="0.3"/>
  <circle cx="300" cy="280" r="190" fill="#ffffff" opacity="0.06"/>
  <g transform="translate(85, 220)">
    <path d="M40 120 L85 65 L220 55 L315 90 L405 102 L415 140 L385 155 L45 155 L20 135 Z" fill="url(#car)" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
    <path d="M100 72 L212 64 L285 92 L90 95 Z" fill="#0f172a" opacity="0.85"/>
    <circle cx="110" cy="155" r="38" fill="#18181b" stroke="#e4e4e7" stroke-width="7"/>
    <circle cx="110" cy="155" r="16" fill="#f97316"/>
    <circle cx="330" cy="155" r="38" fill="#18181b" stroke="#e4e4e7" stroke-width="7"/>
    <circle cx="330" cy="155" r="16" fill="#f97316"/>
  </g>
  <text x="300" y="130" text-anchor="middle" fill="#facc15" font-family="Arial Black, sans-serif" font-size="34" font-style="italic" letter-spacing="3">TREASURE HUNT</text>
  <text x="300" y="535" text-anchor="middle" fill="#ffffff" opacity="0.85" font-family="Arial, sans-serif" font-weight="bold" font-size="20" letter-spacing="4">Sube nuestra foto favorita</text>
</svg>
`)}`;

const FLORES_DEFAULT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="50%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#sky)"/>
  <circle cx="300" cy="255" r="160" fill="#ffffff" opacity="0.35"/>
  <g transform="translate(300, 275)">
    <line x1="0" y1="40" x2="0" y2="210" stroke="#15803d" stroke-width="14" stroke-linecap="round"/>
    <path d="M0 130 Q55 95 75 135 Q40 165 0 140" fill="#16a34a"/>
    <path d="M0 155 Q-55 120 -75 160 Q-40 190 0 165" fill="#16a34a"/>
    <g fill="#facc15" stroke="#eab308" stroke-width="3">
      <ellipse cx="0" cy="-75" rx="24" ry="50"/>
      <ellipse cx="0" cy="75" rx="24" ry="50"/>
      <ellipse cx="-75" cy="0" rx="50" ry="24"/>
      <ellipse cx="75" cy="0" rx="50" ry="24"/>
      <ellipse cx="-53" cy="-53" rx="24" ry="50" transform="rotate(-45 -53 -53)"/>
      <ellipse cx="53" cy="-53" rx="24" ry="50" transform="rotate(45 53 -53)"/>
      <ellipse cx="-53" cy="53" rx="24" ry="50" transform="rotate(45 -53 53)"/>
      <ellipse cx="53" cy="53" rx="24" ry="50" transform="rotate(-45 53 53)"/>
    </g>
    <circle cx="0" cy="0" r="46" fill="#78350f"/>
    <circle cx="0" cy="0" r="34" fill="#92400e"/>
  </g>
  <text x="300" y="545" text-anchor="middle" fill="#78350f" font-family="Georgia, serif" font-size="22" font-style="italic">Para iluminar todos tus días</text>
</svg>
`)}`;

const ANIVERSARIO_DEFAULT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="rom" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4c0519"/>
      <stop offset="50%" stop-color="#881337"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
    <linearGradient id="heart" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fda4af"/>
      <stop offset="50%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#rom)"/>
  <circle cx="300" cy="275" r="185" fill="#fda4af" opacity="0.1"/>
  <circle cx="300" cy="275" r="135" fill="#fda4af" opacity="0.12"/>
  <path d="M300 400 C300 400 165 310 165 220 C165 170 205 135 250 135 C278 135 295 152 300 168 C305 152 322 135 350 135 C395 135 435 170 435 220 C435 310 300 400 300 400 Z" fill="url(#heart)"/>
  <text x="300" y="520" text-anchor="middle" fill="#ffe4e6" font-family="Georgia, serif" font-size="24" font-style="italic">Nuestro lugar favorito es estar juntos</text>
</svg>
`)}`;

export const THEMES: Record<ThemeId, ThemeMeta> = {
  hotwheels: {
    id: "hotwheels",
    name: "Hot Wheels",
    emoji: "🏎️",
    tagline: "Estilo blíster de colección • Azul / Naranja / Rojo",
    badgeText: "EDICIÓN COLECCIONISTA • 1 DE 1",
    defaultSong: "Highway to Our Love — Racing Mix",
    defaultMessage:
      "Entre millones de modelos en el mundo, tú siempre serás mi edición limitada favorita. ¡Contigo recorro cualquier pista!",
    accentGradient: "from-sky-600 via-blue-700 to-orange-500",
    ringColor: "ring-orange-500",
    pricePen: "S/ 14.90",
    defaultImageSvg: HOTWHEELS_DEFAULT_SVG,
  },
  flores: {
    id: "flores",
    name: "Flores Amarillas",
    emoji: "🌻",
    tagline: "Estilo Polaroid primaveral • Amarillo / Ámbar",
    badgeText: "PRIMAVERA ETERNA • DETALLE ESPECIAL",
    defaultSong: "Flores Amarillas — Acústico Especial",
    defaultMessage:
      "Te regalo estas flores que nunca se marchitan, porque lo que siento por ti florece más bonito cada día a tu lado.",
    accentGradient: "from-amber-400 via-yellow-500 to-orange-500",
    ringColor: "ring-amber-400",
    pricePen: "S/ 14.90",
    defaultImageSvg: FLORES_DEFAULT_SVG,
  },
  aniversario: {
    id: "aniversario",
    name: "Aniversario",
    emoji: "❤️",
    tagline: "Estilo romántico elegante • Rosa / Rojo",
    badgeText: "NUESTRA HISTORIA • POR SIEMPRE",
    defaultSong: "Perfect Symphony — Versión Romántica",
    defaultMessage:
      "Cada día contigo suma un recuerdo inolvidable. Gracias por ser mi paz, mi alegría y mi aventura favorita.",
    accentGradient: "from-rose-500 via-pink-600 to-red-600",
    ringColor: "ring-rose-500",
    pricePen: "S/ 14.90",
    defaultImageSvg: ANIVERSARIO_DEFAULT_SVG,
  },
};

export const THEME_LIST: ThemeMeta[] = [
  THEMES.hotwheels,
  THEMES.flores,
  THEMES.aniversario,
];

/**
 * Calculates whole days elapsed since startDate (YYYY-MM-DD) relative to referenceTimestamp.
 * Safe against timezone drift by parsing YYYY-MM-DD in UTC.
 */
export function calculateDaysTogether(
  startDate: string,
  referenceTimestamp?: number,
): number {
  if (!startDate || !referenceTimestamp) return 0;
  const parts = startDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return 0;

  const [year, month, day] = parts;
  const startUtc = Date.UTC(year, month - 1, day);
  const refDate = new Date(referenceTimestamp);
  const nowUtc = Date.UTC(
    refDate.getFullYear(),
    refDate.getMonth(),
    refDate.getDate(),
  );

  const diffMs = nowUtc - startUtc;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

const STORAGE_PREFIX = "detalles_qr_gift_";

export function saveGiftToStorage(gift: GiftData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${gift.slug}`,
      JSON.stringify(gift),
    );
  } catch {
    // Fallback if imageUrl exceeds localStorage quota: save without heavy base64
    try {
      window.localStorage.setItem(
        `${STORAGE_PREFIX}${gift.slug}`,
        JSON.stringify({ ...gift, imageUrl: null }),
      );
    } catch {
      // Ignore storage quota errors silently
    }
  }
}

export function getGiftFromStorage(slug: string): GiftData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    if (!raw) return null;
    return JSON.parse(raw) as GiftData;
  } catch {
    return null;
  }
}

export function createDemoGiftForSlug(slug: string): GiftData {
  const normalized = slug.toLowerCase();
  let theme: ThemeId = "flores";
  if (
    normalized.includes("hot") ||
    normalized.includes("wheel") ||
    normalized.includes("auto")
  ) {
    theme = "hotwheels";
  } else if (
    normalized.includes("amor") ||
    normalized.includes("aniv") ||
    normalized.includes("corazon")
  ) {
    theme = "aniversario";
  }

  const meta = THEMES[theme];
  return {
    slug,
    theme,
    senderName: "Mateo",
    recipientName: "Valentina",
    message: meta.defaultMessage,
    imageUrl: null,
    startDate: "2024-02-14",
    songTitle: meta.defaultSong,
  };
}
