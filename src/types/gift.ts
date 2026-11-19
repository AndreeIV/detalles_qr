import { supabase } from "@/lib/supabase";

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
  musicUrl?: string;
  musicStartSeconds?: number;
  musicClipDuration?: number;
  locationName?: string;
  buyerPhone?: string;
}

export type MusicProvider = "spotify" | "youtube" | "none";

export interface ParsedMusicSource {
  provider: MusicProvider;
  id: string | null;
  spotifyKind?: "track" | "album" | "playlist";
}

/**
 * Extracts Spotify (track/album/playlist) or YouTube video ID from any shared URL.
 */
export function parseMusicUrl(rawUrl?: string): ParsedMusicSource {
  if (!rawUrl || !rawUrl.trim()) {
    return { provider: "none", id: null };
  }

  const url = rawUrl.trim();

  // Match Spotify URLs: https://open.spotify.com/track/ID or /intl-es/track/ID or spotify:track:ID
  const spotifyUriMatch = url.match(
    /spotify:(track|album|playlist):([a-zA-Z0-9]+)/i,
  );
  if (spotifyUriMatch) {
    return {
      provider: "spotify",
      spotifyKind: spotifyUriMatch[1].toLowerCase() as
        | "track"
        | "album"
        | "playlist",
      id: spotifyUriMatch[2],
    };
  }

  const spotifyWebMatch = url.match(
    /open\.spotify\.com\/(?:intl-[a-zA-Z-]+\/)?(?:embed\/)?(track|album|playlist)\/([a-zA-Z0-9]+)/i,
  );
  if (spotifyWebMatch) {
    return {
      provider: "spotify",
      spotifyKind: spotifyWebMatch[1].toLowerCase() as
        | "track"
        | "album"
        | "playlist",
      id: spotifyWebMatch[2],
    };
  }

  // Match YouTube URLs: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  );
  if (ytMatch) {
    return {
      provider: "youtube",
      id: ytMatch[1],
    };
  }

  return { provider: "none", id: null };
}

/**
 * Formats seconds (e.g. 75) into MM:SS ("01:15").
 */
export function formatSecondsToMmSs(totalSeconds = 0): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export interface ResolvedSongAudio {
  displayTitle: string;
  previewAudioUrl: string | null;
}

const resolvedAudioCache = new Map<string, ResolvedSongAudio>();

/**
 * Resolves any YouTube or Spotify song link into its real Song + Artist title
 * and a direct HTML5 <audio> (.m4a) stream URL via oEmbed + iTunes Search API.
 * This prevents YouTube "Video no disponible" (- Topic / VEVO / IP restrictions)
 * and enables true HTML5 volume fade-in and fade-out on mobile phones.
 */
export async function resolveSongMetadataAndAudio(
  musicUrl?: string,
  fallbackSongTitle?: string,
): Promise<ResolvedSongAudio | null> {
  const parsed = parseMusicUrl(musicUrl);
  if (parsed.provider === "none" || !parsed.id) return null;

  const cacheKey = `${parsed.provider}:${parsed.id}`;
  const cached = resolvedAudioCache.get(cacheKey);
  if (cached) return cached;

  try {
    let searchTerm = "";
    let oembedTitle = "";

    if (parsed.provider === "youtube") {
      const cleanYtUrl = `https://www.youtube.com/watch?v=${parsed.id}`;
      const oeRes = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(cleanYtUrl)}`,
      );
      if (oeRes.ok) {
        const oe = (await oeRes.json()) as {
          title?: string;
          author_name?: string;
        };
        const rawTitle = (oe.title || "")
          .replace(/\(.*?\)|\[.*?\]/g, "")
          .replace(/official\s*(music\s*)?video|audio|lyrics?|hd|4k/gi, "")
          .trim();
        const rawAuthor = (oe.author_name || "")
          .replace(/\s*-\s*Topic$/i, "")
          .replace(/VEVO$/i, "")
          .replace(/Official$/i, "")
          .trim();

        oembedTitle =
          rawAuthor && !rawTitle.toLowerCase().includes(rawAuthor.toLowerCase())
            ? `${rawTitle} — ${rawAuthor}`
            : rawTitle;
        searchTerm = `${rawTitle} ${rawAuthor}`.trim();
      }
    } else if (parsed.provider === "spotify") {
      const kind = parsed.spotifyKind || "track";
      const cleanSpUrl = `https://open.spotify.com/${kind}/${parsed.id}`;
      const oeRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanSpUrl)}`,
      );
      if (oeRes.ok) {
        const oe = (await oeRes.json()) as { title?: string };
        oembedTitle = (oe.title || "").trim();
        searchTerm = oembedTitle;
      }
    }

    if (!searchTerm && fallbackSongTitle) {
      searchTerm = fallbackSongTitle.replace(/—/g, " ").trim();
    }

    let previewAudioUrl: string | null = null;
    let finalTitle = oembedTitle || fallbackSongTitle || "Canción Especial";

    if (searchTerm) {
      const itRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=1`,
      );
      if (itRes.ok) {
        const itData = (await itRes.json()) as {
          results?: Array<{
            trackName?: string;
            artistName?: string;
            previewUrl?: string;
          }>;
        };
        const hit = itData.results?.[0];
        if (hit?.previewUrl) {
          previewAudioUrl = hit.previewUrl;
          if (hit.trackName && hit.artistName) {
            finalTitle = `${hit.trackName} — ${hit.artistName}`;
          }
        }
      }
    }

    const result: ResolvedSongAudio = {
      displayTitle: finalTitle,
      previewAudioUrl,
    };
    resolvedAudioCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
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
const LAST_CREATED_SLUG_KEY = "detalles_qr_last_created_slug";

export function normalizePhoneDigits(phone?: string): string {
  return (phone || "").replace(/\D/g, "");
}

export function saveGiftToStorage(gift: GiftData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_CREATED_SLUG_KEY, gift.slug);
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${gift.slug}`,
      JSON.stringify(gift),
    );
  } catch {
    // Fallback if imageUrl exceeds localStorage quota: save without heavy base64
    try {
      window.localStorage.setItem(LAST_CREATED_SLUG_KEY, gift.slug);
      window.localStorage.setItem(
        `${STORAGE_PREFIX}${gift.slug}`,
        JSON.stringify({ ...gift, imageUrl: null }),
      );
    } catch {
      // Ignore storage quota errors silently
    }
  }
}

export function getLastCreatedGiftFromStorage(): GiftData | null {
  if (typeof window === "undefined") return null;
  try {
    const lastSlug = window.localStorage.getItem(LAST_CREATED_SLUG_KEY);
    if (!lastSlug) return null;
    return getGiftFromStorage(lastSlug);
  } catch {
    return null;
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

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, base64] = dataUrl.split(",");
    if (!header || !base64) return null;
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Saves the gift to Supabase (cloud DB + Storage) if configured in .env.local,
 * while also caching in localStorage as a fallback.
 */
export async function saveGiftCloudOrLocal(
  gift: GiftData,
): Promise<{ savedToCloud: boolean }> {
  saveGiftToStorage(gift);

  if (!supabase) {
    return { savedToCloud: false };
  }

  try {
    let finalImageUrl = gift.imageUrl;

    // Upload base64 photo to Supabase Storage bucket "gift-photos" if present
    if (gift.imageUrl?.startsWith("data:image/")) {
      const blob = dataUrlToBlob(gift.imageUrl);
      if (blob) {
        const filePath = `${gift.slug}-${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("gift-photos")
          .upload(filePath, blob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!uploadErr) {
          const { data: pubData } = supabase.storage
            .from("gift-photos")
            .getPublicUrl(filePath);
          if (pubData?.publicUrl) {
            finalImageUrl = pubData.publicUrl;
          }
        }
      }
    }

    const baseRow = {
      slug: gift.slug,
      theme: gift.theme,
      sender_name: gift.senderName,
      recipient_name: gift.recipientName,
      message: gift.message,
      image_url: finalImageUrl,
      start_date: gift.startDate,
      song_title: gift.songTitle || "",
      music_url: gift.musicUrl || "",
      music_start_seconds: gift.musicStartSeconds ?? 0,
      music_clip_duration: gift.musicClipDuration ?? 30,
    };

    const cleanPhone = normalizePhoneDigits(gift.buyerPhone);

    // Try upserting with location_name and buyer_phone first
    const { error } = await supabase.from("gifts").upsert(
      {
        ...baseRow,
        location_name: gift.locationName?.trim() || "Lima, Perú",
        buyer_phone: cleanPhone,
      },
      { onConflict: "slug" },
    );

    if (error) {
      // Fallback 1: try with location_name only (in case buyer_phone column wasn't added yet)
      const { error: locOnlyErr } = await supabase.from("gifts").upsert(
        {
          ...baseRow,
          location_name: gift.locationName?.trim() || "Lima, Perú",
        },
        { onConflict: "slug" },
      );

      if (locOnlyErr) {
        // Fallback 2: base columns only
        const { error: retryErr } = await supabase
          .from("gifts")
          .upsert(baseRow, { onConflict: "slug" });
        if (retryErr) {
          return { savedToCloud: false };
        }
      }
    }

    return { savedToCloud: true };
  } catch {
    return { savedToCloud: false };
  }
}

/**
 * Fetches a gift by slug from Supabase first (so any phone scanning the QR sees it),
 * falling back to localStorage if offline or not yet configured.
 */
export async function fetchGiftCloudOrLocal(
  slug: string,
): Promise<GiftData | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        return {
          slug: data.slug as string,
          theme: (data.theme as ThemeId) || "flores",
          senderName: (data.sender_name as string) || "Mateo",
          recipientName: (data.recipient_name as string) || "Valentina",
          message: (data.message as string) || "",
          imageUrl: (data.image_url as string | null) ?? null,
          startDate: (data.start_date as string) || "2024-09-21",
          songTitle: (data.song_title as string) || "",
          musicUrl: (data.music_url as string) || "",
          musicStartSeconds: Number(data.music_start_seconds ?? 0),
          musicClipDuration: Number(data.music_clip_duration ?? 30),
          locationName: (data.location_name as string) || "Lima, Perú",
          buyerPhone: (data.buyer_phone as string) || "",
        };
      }
    } catch {
      // Fallback to local storage
    }
  }

  return getGiftFromStorage(slug);
}

/**
 * Recovers gifts by buyer phone number + recipient name from Supabase and localStorage.
 */
export async function recoverGiftsByPhoneAndRecipient(
  buyerPhone: string,
  recipientName: string,
): Promise<GiftData[]> {
  const cleanPhone = normalizePhoneDigits(buyerPhone);
  const normalizeText = (t: string) =>
    t
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const targetRecipient = normalizeText(recipientName);
  const resultsMap = new Map<string, GiftData>();

  // 1. Check Supabase cloud database
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        for (const row of data) {
          const rowPhone = normalizePhoneDigits(String(row.buyer_phone || ""));
          const rowRecipient = normalizeText(String(row.recipient_name || ""));
          const rowSender = normalizeText(String(row.sender_name || ""));

          const phoneMatches =
            cleanPhone.length >= 6 &&
            rowPhone.length >= 6 &&
            (rowPhone.includes(cleanPhone) || cleanPhone.includes(rowPhone));

          const recipientMatches =
            targetRecipient.length >= 2 &&
            (rowRecipient.includes(targetRecipient) ||
              targetRecipient.includes(rowRecipient));

          // Match if (phone + recipient match), OR if older gift had no phone saved yet and user typed sender Phone/Name + recipient
          const legacyMatchWithoutPhone =
            rowPhone.length === 0 &&
            recipientMatches &&
            normalizeText(buyerPhone).length >= 2 &&
            rowSender.includes(normalizeText(buyerPhone));

          if ((phoneMatches && recipientMatches) || legacyMatchWithoutPhone) {
            const slug = String(row.slug);
            resultsMap.set(slug, {
              slug,
              theme: (row.theme as ThemeId) || "flores",
              senderName: String(row.sender_name || "Mateo"),
              recipientName: String(row.recipient_name || "Valentina"),
              message: String(row.message || ""),
              imageUrl: (row.image_url as string | null) ?? null,
              startDate: String(row.start_date || "2024-09-21"),
              songTitle: String(row.song_title || ""),
              musicUrl: String(row.music_url || ""),
              musicStartSeconds: Number(row.music_start_seconds ?? 0),
              musicClipDuration: Number(row.music_clip_duration ?? 30),
              locationName: String(row.location_name || "Lima, Perú"),
              buyerPhone: rowPhone,
            });
          }
        }
      }
    } catch {
      // Ignore cloud query errors and check local storage
    }
  }

  // 2. Check localStorage on current device
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as GiftData;
        const localPhone = normalizePhoneDigits(parsed.buyerPhone);
        const localRecipient = normalizeText(parsed.recipientName || "");

        const phoneMatches =
          cleanPhone.length >= 6 &&
          (localPhone.includes(cleanPhone) || localPhone.length === 0);
        const recipientMatches =
          targetRecipient.length >= 2 &&
          localRecipient.includes(targetRecipient);

        if (phoneMatches && recipientMatches && !resultsMap.has(parsed.slug)) {
          resultsMap.set(parsed.slug, parsed);
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }

  return Array.from(resultsMap.values());
}

export interface PublicCoupleEntry {
  id: string;
  theme: ThemeId;
  senderName: string;
  recipientName: string;
  startDate: string;
  createdAt: string;
  city: string;
  /** Map coordinates in percentage (x: 10..90, y: 12..88) */
  mapX: number;
  mapY: number;
  isLiveFromDb?: boolean;
}

export const MAP_LOCATIONS = [
  { city: "Lima, Perú", x: 34, y: 64 },
  { city: "Arequipa, Perú", x: 39, y: 74 },
  { city: "Trujillo, Perú", x: 30, y: 52 },
  { city: "Cusco, Perú", x: 42, y: 67 },
  { city: "Piura, Perú", x: 27, y: 42 },
  { city: "Chiclayo, Perú", x: 28, y: 47 },
  { city: "Huancayo, Perú", x: 37, y: 61 },
  { city: "Ica, Perú", x: 35, y: 69 },
  { city: "Cajamarca, Perú", x: 32, y: 49 },
  { city: "Tacna, Perú", x: 41, y: 80 },
  { city: "Puno, Perú", x: 44, y: 72 },
  { city: "Chimbote, Perú", x: 31, y: 56 },
  { city: "Iquitos, Perú", x: 39, y: 39 },
  { city: "Pucallpa, Perú", x: 38, y: 53 },
  { city: "Ayacucho, Perú", x: 39, y: 65 },
  { city: "Bogotá, Colombia", x: 33, y: 30 },
  { city: "Medellín, Colombia", x: 31, y: 26 },
  { city: "Quito, Ecuador", x: 29, y: 36 },
  { city: "Santiago, Chile", x: 39, y: 86 },
  { city: "Buenos Aires, Argentina", x: 52, y: 84 },
  { city: "Ciudad de México, MX", x: 18, y: 18 },
  { city: "Madrid, España", x: 76, y: 22 },
  { city: "Miami, EE. UU.", x: 26, y: 14 },
];

function hashSlugToIndex(slug: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

/**
 * Matches a chosen or detected city string (e.g. "Arequipa, Perú" or "Miraflores, Lima")
 * to its map coordinates, with a slight deterministic jitter so pins in the same city don't overlap.
 */
export function resolveCoordinatesForLocation(
  locationName: string,
  slug: string,
): { x: number; y: number } {
  const normalized = (locationName || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const matched = MAP_LOCATIONS.find((loc) => {
    const cityKey = loc.city
      .split(",")[0]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return normalized.includes(cityKey);
  });

  const baseLoc =
    matched || MAP_LOCATIONS[hashSlugToIndex(slug, MAP_LOCATIONS.length)];

  const jitterX = (hashSlugToIndex(`${slug}-x`, 9) - 4) * 1.3;
  const jitterY = (hashSlugToIndex(`${slug}-y`, 9) - 4) * 1.3;

  return {
    x: Math.min(88, Math.max(12, Math.round(baseLoc.x + jitterX))),
    y: Math.min(88, Math.max(12, Math.round(baseLoc.y + jitterY))),
  };
}

/**
 * Detects the user's real city & country using browser Geolocation (if requested)
 * or automatic IP reverse-geocoding (no permission popup required when useGps is false).
 */
export async function detectUserCity(useGps = false): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const fetchCityFromApi = async (lat?: number, lng?: number) => {
    const params = new URLSearchParams({ localityLanguage: "es" });
    if (lat !== undefined && lng !== undefined) {
      params.set("latitude", String(lat));
      params.set("longitude", String(lng));
    }
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    const city = data.city || data.locality || data.principalSubdivision || "";
    const country = (data.countryName || "Perú").replace(/\s*\(.*?\)\s*/g, "");
    if (!city) return null;
    return `${city}, ${country}`;
  };

  if (useGps && "geolocation" in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 6000,
        });
      });
      const fromGps = await fetchCityFromApi(
        pos.coords.latitude,
        pos.coords.longitude,
      );
      if (fromGps) return fromGps;
    } catch {
      // Fallback to IP-based detection if user declines GPS prompt
    }
  }

  try {
    return await fetchCityFromApi();
  } catch {
    return null;
  }
}

const SHOWCASE_COUPLES: PublicCoupleEntry[] = [
  {
    id: "demo-1",
    theme: "hotwheels",
    senderName: "Mateo",
    recipientName: "Valentina",
    startDate: "2023-09-21",
    createdAt: "2026-11-14T18:30:00Z",
    city: "Miraflores, Lima",
    mapX: 34,
    mapY: 63,
  },
  {
    id: "demo-2",
    theme: "flores",
    senderName: "Sebastián",
    recipientName: "Camila",
    startDate: "2024-02-14",
    createdAt: "2026-11-14T20:15:00Z",
    city: "Arequipa, Perú",
    mapX: 40,
    mapY: 74,
  },
  {
    id: "demo-3",
    theme: "aniversario",
    senderName: "Diego",
    recipientName: "Luciana",
    startDate: "2022-07-10",
    createdAt: "2026-11-15T01:10:00Z",
    city: "Trujillo, Perú",
    mapX: 29,
    mapY: 51,
  },
  {
    id: "demo-4",
    theme: "hotwheels",
    senderName: "Joaquín",
    recipientName: "Ariana",
    startDate: "2024-05-04",
    createdAt: "2026-11-15T02:40:00Z",
    city: "Cusco, Perú",
    mapX: 44,
    mapY: 67,
  },
  {
    id: "demo-5",
    theme: "flores",
    senderName: "Rodrigo",
    recipientName: "Fernanda",
    startDate: "2023-11-18",
    createdAt: "2026-11-15T03:12:00Z",
    city: "Piura, Perú",
    mapX: 26,
    mapY: 42,
  },
  {
    id: "demo-6",
    theme: "aniversario",
    senderName: "Álvaro",
    recipientName: "Daniela",
    startDate: "2021-12-03",
    createdAt: "2026-11-15T03:50:00Z",
    city: "Santiago, Chile",
    mapX: 39,
    mapY: 85,
  },
  {
    id: "demo-7",
    theme: "hotwheels",
    senderName: "Nicolás",
    recipientName: "Valeria",
    startDate: "2024-08-12",
    createdAt: "2026-11-15T04:10:00Z",
    city: "Bogotá, Colombia",
    mapX: 33,
    mapY: 29,
  },
];

/**
 * Fetches public couple records from Supabase (only names, theme, start_date, and location_name
 * so photos and dedication messages remain 100% private), combined with showcase pins.
 */
export async function fetchPublicCouples(): Promise<PublicCoupleEntry[]> {
  const dbCouples: PublicCoupleEntry[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        data.forEach((row, idx) => {
          const slug = String(row.slug || `db-${idx}`);
          const savedCity =
            typeof row.location_name === "string" && row.location_name.trim()
              ? row.location_name.trim()
              : "Lima, Perú";
          const coords = resolveCoordinatesForLocation(savedCity, slug);

          dbCouples.push({
            id: slug,
            theme: (row.theme as ThemeId) || "aniversario",
            senderName: String(row.sender_name || "Remitente"),
            recipientName: String(row.recipient_name || "Destinatario"),
            startDate: String(row.start_date || "2024-02-14"),
            createdAt: String(row.created_at || new Date().toISOString()),
            city: savedCity,
            mapX: coords.x,
            mapY: coords.y,
            isLiveFromDb: true,
          });
        });
      }
    } catch {
      // Ignore network errors and fall back to showcase list
    }
  }

  return [...dbCouples, ...SHOWCASE_COUPLES];
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
    musicUrl: "",
    musicStartSeconds: 45,
    musicClipDuration: 30,
    locationName: "Lima, Perú",
  };
}
