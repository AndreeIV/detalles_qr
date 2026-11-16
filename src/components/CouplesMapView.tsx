"use client";

import {
  CalendarHeart,
  Compass,
  Crown,
  Heart,
  MapPin,
  Maximize2,
  Move3d,
  Network,
  Orbit,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateDaysTogether,
  fetchPublicCouples,
  type PublicCoupleEntry,
  THEME_LIST,
  THEMES,
  type ThemeId,
} from "@/types/gift";

interface CouplesMapViewProps {
  onStartBuilding: (theme?: ThemeId) => void;
}

interface Node3D {
  couple: PublicCoupleEntry;
  /** 3D coordinates in model space (-1..1 range) */
  x: number;
  y: number;
  z: number;
  baseRadius: number;
  phase: number;
}

interface Edge3D {
  fromIdx: number;
  toIdx: number;
}

interface ProjectedNode {
  idx: number;
  screenX: number;
  screenY: number;
  scale: number;
  depthZ: number;
}

const EXTRA_NEURAL_COUPLES: PublicCoupleEntry[] = [
  {
    id: "neural-1",
    theme: "aniversario",
    senderName: "Santiago",
    recipientName: "Isabella",
    startDate: "2022-04-19",
    createdAt: "2026-11-10T12:00:00Z",
    city: "Barranco, Lima",
    mapX: 50,
    mapY: 50,
  },
  {
    id: "neural-2",
    theme: "hotwheels",
    senderName: "Leonardo",
    recipientName: "Mía",
    startDate: "2023-10-08",
    createdAt: "2026-11-11T15:00:00Z",
    city: "Cusco, Perú",
    mapX: 50,
    mapY: 50,
  },
  {
    id: "neural-3",
    theme: "flores",
    senderName: "Gabriel",
    recipientName: " Antonella",
    startDate: "2024-09-21",
    createdAt: "2026-11-12T10:00:00Z",
    city: "Arequipa, Perú",
    mapX: 50,
    mapY: 50,
  },
  {
    id: "neural-4",
    theme: "aniversario",
    senderName: "Matías",
    recipientName: "Zoe",
    startDate: "2021-06-15",
    createdAt: "2026-11-12T18:00:00Z",
    city: "Trujillo, Perú",
    mapX: 50,
    mapY: 50,
  },
  {
    id: "neural-5",
    theme: "hotwheels",
    senderName: "Emiliano",
    recipientName: "Renata",
    startDate: "2024-01-20",
    createdAt: "2026-11-13T09:00:00Z",
    city: "Piura, Perú",
    mapX: 50,
    mapY: 50,
  },
  {
    id: "neural-6",
    theme: "flores",
    senderName: "Daniel",
    recipientName: "Victoria",
    startDate: "2023-03-21",
    createdAt: "2026-11-13T14:00:00Z",
    city: "Chiclayo, Perú",
    mapX: 50,
    mapY: 50,
  },
  {
    id: "neural-7",
    theme: "aniversario",
    senderName: "Tomás",
    recipientName: "Martina",
    startDate: "2022-11-02",
    createdAt: "2026-11-13T21:00:00Z",
    city: "Huancayo, Perú",
    mapX: 50,
    mapY: 50,
  },
  {
    id: "neural-8",
    theme: "hotwheels",
    senderName: "Adrián",
    recipientName: "Elena",
    startDate: "2024-07-14",
    createdAt: "2026-11-14T08:00:00Z",
    city: "Ica, Perú",
    mapX: 50,
    mapY: 50,
  },
  {
    id: "neural-9",
    theme: "flores",
    senderName: "Bruno",
    recipientName: "Julieta",
    startDate: "2023-05-28",
    createdAt: "2026-11-14T11:00:00Z",
    city: "Cajamarca, Perú",
    mapX: 50,
    mapY: 50,
  },
  {
    id: "neural-10",
    theme: "aniversario",
    senderName: "Gael",
    recipientName: "Romina",
    startDate: "2020-08-30",
    createdAt: "2026-11-14T16:00:00Z",
    city: "Tacna, Perú",
    mapX: 50,
    mapY: 50,
  },
];

function deterministicHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generates a 3D Obsidian-style neural graph:
 * - Distributes nodes inside a 3D spherical volume with organic radius variation
 * - Connects each node to its closest 3D neighbors to form a neural constellation
 */
function buildNeuralGraph(couples: PublicCoupleEntry[]): {
  nodes: Node3D[];
  edges: Edge3D[];
} {
  const n = couples.length;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  const nodes: Node3D[] = couples.map((couple, i) => {
    const h = deterministicHash(couple.id);
    // Fibonacci sphere base + deterministic organic radial variation (0.42 to 1.0)
    const theta = (2 * Math.PI * i) / goldenRatio + ((h % 100) / 100) * 0.45;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / Math.max(1, n));
    const radius = 0.48 + ((h >>> 8) % 52) / 100;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    return {
      couple,
      x,
      y,
      z,
      baseRadius: couple.isLiveFromDb ? 7.5 : 5.5,
      phase: ((h >>> 16) % 628) / 100,
    };
  });

  // Connect each node to its 2 nearest neighbors + 1 same-theme neighbor for Obsidian-like clusters
  const edgeSet = new Set<string>();
  const edges: Edge3D[] = [];

  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const key = `${min}-${max}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ fromIdx: min, toIdx: max });
    }
  };

  for (let i = 0; i < nodes.length; i++) {
    const distances: { idx: number; dist: number; sameTheme: boolean }[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      distances.push({
        idx: j,
        dist,
        sameTheme: nodes[i].couple.theme === nodes[j].couple.theme,
      });
    }

    distances.sort((a, b) => a.dist - b.dist);
    if (distances[0]) addEdge(i, distances[0].idx);
    if (distances[1]) addEdge(i, distances[1].idx);

    const sameThemeNeighbor = distances.find((d) => d.sameTheme);
    if (sameThemeNeighbor) addEdge(i, sameThemeNeighbor.idx);
  }

  return { nodes, edges };
}

function getThemeColors(theme: ThemeId) {
  if (theme === "hotwheels") {
    return {
      core: "#fb923c", // orange-400
      glow: "rgba(249, 115, 22, 0.55)",
      edge: "rgba(56, 189, 248, 0.75)",
    };
  }
  if (theme === "flores") {
    return {
      core: "#facc15", // yellow-400
      glow: "rgba(250, 204, 21, 0.55)",
      edge: "rgba(251, 191, 36, 0.75)",
    };
  }
  return {
    core: "#fb7185", // rose-400
    glow: "rgba(244, 63, 94, 0.6)",
    edge: "rgba(251, 113, 133, 0.8)",
  };
}

export default function CouplesMapView({
  onStartBuilding,
}: CouplesMapViewProps) {
  const [couples, setCouples] = useState<PublicCoupleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [themeFilter, setThemeFilter] = useState<ThemeId | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoomDisplay, setZoomDisplay] = useState(100);
  const [nowTimestamp, setNowTimestamp] = useState<number | undefined>(
    undefined,
  );

  // 3D Camera & Interaction Refs for 60fps Canvas Loop
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef({ yaw: 0.4, pitch: 0.25 });
  const targetRotationRef = useRef<{ yaw: number; pitch: number } | null>(null);
  const velocityRef = useRef({ yaw: 0, pitch: 0 });
  const zoomRef = useRef(1.0);
  const targetZoomRef = useRef(1.0);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const hoveredIdxRef = useRef<number | null>(null);
  const projectedNodesRef = useRef<ProjectedNode[]>([]);

  const loadCouples = useCallback(async () => {
    setIsLoading(true);
    const list = await fetchPublicCouples();
    // Combine DB + showcase + neural nodes for a rich Obsidian network
    const existingIds = new Set(list.map((c) => c.id));
    const merged = [
      ...list,
      ...EXTRA_NEURAL_COUPLES.filter((c) => !existingIds.has(c.id)),
    ];
    setCouples(merged);
    if (merged.length > 0) {
      setSelectedId((prev) => prev ?? merged[0].id);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setNowTimestamp(Date.now());
    loadCouples();
  }, [loadCouples]);

  const filteredCouples = useMemo(() => {
    return couples.filter((c) => {
      const matchesTheme = themeFilter === "all" || c.theme === themeFilter;
      if (!matchesTheme) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.senderName.toLowerCase().includes(q) ||
        c.recipientName.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [couples, themeFilter, searchQuery]);

  const { nodes, edges } = useMemo(
    () => buildNeuralGraph(filteredCouples),
    [filteredCouples],
  );

  const activeCouple =
    filteredCouples.find((c) => c.id === selectedId) ||
    filteredCouples[0] ||
    null;

  // Smoothly rotate the 3D camera to bring a selected node to the front
  const focusNodeById = useCallback(
    (id: string) => {
      setSelectedId(id);
      const found = nodes.find((n) => n.couple.id === id);
      if (!found) return;

      // Calculate yaw & pitch that rotate (found.x, found.y, found.z) toward +Z (front of camera)
      const desiredYaw = -Math.atan2(found.x, found.z);
      const hyp = Math.sqrt(found.x * found.x + found.z * found.z);
      const desiredPitch = Math.atan2(found.y, hyp);

      targetRotationRef.current = {
        yaw: desiredYaw,
        pitch: Math.max(-1.2, Math.min(1.2, desiredPitch)),
      };
    },
    [nodes],
  );

  const handleZoom = (delta: number) => {
    const next = Math.max(0.45, Math.min(3.2, targetZoomRef.current + delta));
    targetZoomRef.current = next;
    setZoomDisplay(Math.round(next * 100));
  };

  const handleResetCamera = () => {
    targetZoomRef.current = 1.0;
    setZoomDisplay(100);
    targetRotationRef.current = { yaw: 0.4, pitch: 0.25 };
    setAutoRotate(true);
  };

  // Main 60fps 3D Obsidian Neural Graph Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.016;

      // Resize canvas to crisp devicePixelRatio
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (
        canvas.width !== Math.floor(width * dpr) ||
        canvas.height !== Math.floor(height * dpr)
      ) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Background Deep Obsidian Space
      ctx.fillStyle = "#06070b";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Subtle radial nebula glow in center
      const bgGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        Math.max(width, height) * 0.55,
      );
      bgGrad.addColorStop(0, "rgba(245, 158, 11, 0.06)");
      bgGrad.addColorStop(0.45, "rgba(225, 29, 72, 0.04)");
      bgGrad.addColorStop(1, "rgba(6, 7, 11, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Update Camera Physics (Smooth Zoom, Target Focus, or Auto-Orbit)
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.12;

      if (!isDraggingRef.current) {
        if (targetRotationRef.current) {
          const dyaw = targetRotationRef.current.yaw - rotationRef.current.yaw;
          const dpitch =
            targetRotationRef.current.pitch - rotationRef.current.pitch;
          rotationRef.current.yaw += dyaw * 0.1;
          rotationRef.current.pitch += dpitch * 0.1;
          if (Math.abs(dyaw) < 0.005 && Math.abs(dpitch) < 0.005) {
            targetRotationRef.current = null;
          }
        } else {
          // Apply inertia + optional gentle auto-orbit
          rotationRef.current.yaw +=
            velocityRef.current.yaw + (autoRotate ? 0.0028 : 0);
          rotationRef.current.pitch = Math.max(
            -1.35,
            Math.min(
              1.35,
              rotationRef.current.pitch + velocityRef.current.pitch,
            ),
          );
          velocityRef.current.yaw *= 0.92;
          velocityRef.current.pitch *= 0.92;
        }
      }

      const cosY = Math.cos(rotationRef.current.yaw);
      const sinY = Math.sin(rotationRef.current.yaw);
      const cosX = Math.cos(rotationRef.current.pitch);
      const sinX = Math.sin(rotationRef.current.pitch);

      const baseScale = Math.min(width, height) * 0.36 * zoomRef.current;
      const fov = 2.6;

      // 3. Project 3D Nodes into 2D Screen Space with subtle neural breathing
      const projected: ProjectedNode[] = nodes.map((node, idx) => {
        const pulseX = node.x + Math.sin(time * 1.1 + node.phase) * 0.018;
        const pulseY = node.y + Math.cos(time * 0.9 + node.phase) * 0.018;
        const pulseZ = node.z + Math.sin(time * 1.3 + node.phase) * 0.018;

        // Rotate around Y axis (yaw)
        const x1 = pulseX * cosY - pulseZ * sinY;
        const z1 = pulseZ * cosY + pulseX * sinY;

        // Rotate around X axis (pitch)
        const y2 = pulseY * cosX - z1 * sinX;
        const z2 = z1 * cosX + pulseY * sinX;

        const perspective = fov / Math.max(0.4, fov - z2);
        const screenX = centerX + x1 * baseScale * perspective;
        const screenY = centerY + y2 * baseScale * perspective;

        return {
          idx,
          screenX,
          screenY,
          scale: perspective * Math.sqrt(zoomRef.current),
          depthZ: z2,
        };
      });

      projectedNodesRef.current = projected;

      const selectedNodeIdx = nodes.findIndex(
        (n) => n.couple.id === activeCouple?.id,
      );
      const hoveredIdx = hoveredIdxRef.current;
      const focusIdx = hoveredIdx !== null ? hoveredIdx : selectedNodeIdx;

      // Track neighbor indices of the focused node so we light up its neural cluster!
      const connectedIndices = new Set<number>();
      if (focusIdx >= 0) {
        connectedIndices.add(focusIdx);
        for (const edge of edges) {
          if (edge.fromIdx === focusIdx) connectedIndices.add(edge.toIdx);
          if (edge.toIdx === focusIdx) connectedIndices.add(edge.fromIdx);
        }
      }

      // 4. Draw Neural Synaptic Edges
      for (const edge of edges) {
        const pA = projected[edge.fromIdx];
        const pB = projected[edge.toIdx];
        if (!pA || !pB) continue;

        const isHighlightedEdge =
          focusIdx >= 0 &&
          (edge.fromIdx === focusIdx || edge.toIdx === focusIdx);

        const avgDepth = (pA.depthZ + pB.depthZ) / 2;
        const depthAlpha = Math.max(0.05, Math.min(0.85, (avgDepth + 1.2) / 2));

        ctx.beginPath();
        ctx.moveTo(pA.screenX, pA.screenY);
        ctx.lineTo(pB.screenX, pB.screenY);

        if (isHighlightedEdge) {
          const focusTheme = nodes[focusIdx]?.couple.theme || "aniversario";
          const colors = getThemeColors(focusTheme);
          ctx.strokeStyle = colors.edge;
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Traveling synaptic light pulse along highlighted edges!
          const tPulse = (time * 0.65 + (edge.fromIdx % 5) * 0.2) % 1;
          const px = pA.screenX + (pB.screenX - pA.screenX) * tPulse;
          const py = pA.screenY + (pB.screenY - pA.screenY) * tPulse;
          ctx.beginPath();
          ctx.arc(px, py, 2.3, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        } else {
          ctx.strokeStyle = `rgba(148, 163, 184, ${depthAlpha * 0.22})`;
          ctx.lineWidth = 0.85;
          ctx.stroke();
        }
      }

      // 5. Sort Nodes Back-to-Front (Painter's Algorithm) and Draw Glowing Neural Orbs
      const sortedProjected = [...projected].sort(
        (a, b) => a.depthZ - b.depthZ,
      );

      for (const proj of sortedProjected) {
        const node = nodes[proj.idx];
        const { couple } = node;
        const colors = getThemeColors(couple.theme);

        const isSelected = proj.idx === selectedNodeIdx;
        const isHovered = proj.idx === hoveredIdx;
        const isConnected = connectedIndices.has(proj.idx);

        const depthOpacity = Math.max(
          0.25,
          Math.min(1, (proj.depthZ + 1.35) / 2.1),
        );
        const dimFactor =
          focusIdx >= 0 && !isConnected && !isSelected ? 0.45 : 1;
        const alpha = depthOpacity * dimFactor;

        const r =
          node.baseRadius *
          proj.scale *
          (isSelected ? 1.45 : isHovered ? 1.3 : 1);

        // Outer Halo Glow
        const glowRadius = r * (isSelected || isHovered ? 3.8 : 2.4);
        const grad = ctx.createRadialGradient(
          proj.screenX,
          proj.screenY,
          r * 0.2,
          proj.screenX,
          proj.screenY,
          glowRadius,
        );
        grad.addColorStop(0, colors.glow);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(proj.screenX, proj.screenY, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Selection / Live DB Outer Ring
        if (isSelected || isHovered || couple.isLiveFromDb) {
          ctx.beginPath();
          ctx.arc(
            proj.screenX,
            proj.screenY,
            r + (isSelected ? 5 : 3),
            0,
            Math.PI * 2,
          );
          ctx.strokeStyle = isSelected
            ? "#ffffff"
            : couple.isLiveFromDb
              ? "#34d399"
              : colors.core;
          ctx.lineWidth = isSelected ? 2 : 1.2;
          ctx.stroke();
        }

        // Core Orb
        ctx.beginPath();
        ctx.arc(proj.screenX, proj.screenY, r, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#ffffff" : colors.core;
        ctx.fill();

        // Crisp Obsidian Node Label (only for selected, hovered, connected, or zoomed-in foreground nodes!)
        const showLabel =
          isSelected ||
          isHovered ||
          (isConnected && proj.depthZ > -0.2) ||
          (zoomRef.current > 1.45 && proj.depthZ > 0.15);

        if (showLabel) {
          const labelText = `${couple.senderName} & ${couple.recipientName}`;
          ctx.font = `${isSelected || isHovered ? "700" : "500"} ${
            isSelected ? 12 : 10.5
          }px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = "center";

          const textWidth = ctx.measureText(labelText).width;
          const pillX = proj.screenX - textWidth / 2 - 7;
          const pillY = proj.screenY + r + 6;

          ctx.fillStyle = isSelected
            ? "rgba(9, 9, 11, 0.92)"
            : "rgba(9, 9, 11, 0.72)";
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, textWidth + 14, 18, 6);
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = colors.core;
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          ctx.fillStyle = isSelected ? "#ffffff" : "#e4e4e7";
          ctx.fillText(labelText, proj.screenX, pillY + 12.5);
        }

        ctx.globalAlpha = 1;
      }

      ctx.restore();
      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [nodes, edges, activeCouple, autoRotate]);

  // Pointer & Wheel Handlers for 3D Orbit + Node Picking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      const next = Math.max(0.45, Math.min(3.2, targetZoomRef.current + delta));
      targetZoomRef.current = next;
      setZoomDisplay(Math.round(next * 100));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  const findHitNodeIndex = (
    clientX: number,
    clientY: number,
  ): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check front-most nodes first
    const frontFirst = [...projectedNodesRef.current].sort(
      (a, b) => b.depthZ - a.depthZ,
    );

    for (const proj of frontFirst) {
      const node = nodes[proj.idx];
      if (!node) continue;
      const hitRadius = Math.max(14, node.baseRadius * proj.scale + 8);
      const dx = x - proj.screenX;
      const dy = y - proj.screenY;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return proj.idx;
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    targetRotationRef.current = null;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - lastPointerPosRef.current.x;
      const dy = e.clientY - lastPointerPosRef.current.y;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.0065;
      rotationRef.current.yaw += dx * sensitivity;
      rotationRef.current.pitch = Math.max(
        -1.35,
        Math.min(1.35, rotationRef.current.pitch + dy * sensitivity),
      );
      velocityRef.current = {
        yaw: dx * sensitivity * 0.35,
        pitch: dy * sensitivity * 0.35,
      };
      return;
    }

    // Hover hit test
    const hitIdx = findHitNodeIndex(e.clientX, e.clientY);
    hoveredIdxRef.current = hitIdx;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hitIdx !== null ? "pointer" : "grab";
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    const movedDist = Math.hypot(
      e.clientX - dragStartPosRef.current.x,
      e.clientY - dragStartPosRef.current.y,
    );

    // If it was a tap/click (not a drag), check if user clicked a 3D node!
    if (movedDist < 7) {
      const hitIdx = findHitNodeIndex(e.clientX, e.clientY);
      if (hitIdx !== null && nodes[hitIdx]) {
        focusNodeById(nodes[hitIdx].couple.id);
      }
    }
  };

  const totalDaysAccumulated = couples.reduce(
    (acc, item) => acc + calculateDaysTogether(item.startDate, nowTimestamp),
    0,
  );

  const topCouple =
    couples.length > 0
      ? [...couples].sort(
          (a, b) =>
            calculateDaysTogether(b.startDate, nowTimestamp) -
            calculateDaysTogether(a.startDate, nowTimestamp),
        )[0]
      : null;

  return (
    <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7 animate-in fade-in duration-500">
      {/* Header & Live Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Network className="w-3.5 h-3.5 text-purple-400" />
            <span>Red Neuronal 3D Interactiva • En vivo desde Supabase</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Orbit className="w-8 h-8 text-amber-400 shrink-0" />
            <span>Constelación Neuronal de Parejas</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Explora nuestra galaxia estilo Obsidian en 3D: gira la red con el
            mouse o tu dedo, acércate con zoom y toca cualquier nodo luminoso
            para revelar su historia, ciudad y días juntos.
          </p>
        </div>

        {/* 3 Live Counter Cards */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Nodos Activos</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5 tabular-nums">
              {couples.length}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>Días sumados</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-rose-300 mt-0.5 tabular-nums">
              {totalDaysAccumulated.toLocaleString("es-PE")}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Récord</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-emerald-300 mt-1 truncate">
              {topCouple
                ? `${topCouple.senderName} & ${topCouple.recipientName}`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl bg-zinc-900/75 border border-zinc-800/90 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 backdrop-blur-xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Busca un nodo por nombre o ciudad (ej. Andree, Paula, Lima)..."
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>

        {/* Theme Filter Pills + Refresh */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setThemeFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              themeFilter === "all"
                ? "bg-zinc-100 text-zinc-950 shadow"
                : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            Todos ({couples.length})
          </button>

          {THEME_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setThemeFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                themeFilter === t.id
                  ? "bg-zinc-100 text-zinc-950 shadow"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {t.emoji} {t.name}
            </button>
          ))}

          <button
            type="button"
            onClick={loadCouples}
            title="Actualizar nodos desde Supabase"
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Main Split: 3D Obsidian Neural Graph Canvas (Left 7 cols) + Inspector & List (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: 3D Interactive Obsidian Neural Canvas */}
        <div className="lg:col-span-7 rounded-[32px] bg-zinc-900/80 border border-zinc-800/90 p-3.5 sm:p-5 shadow-2xl overflow-hidden flex flex-col gap-3.5">
          {/* Top Canvas Toolbar (Never overlaps on mobile!) */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="inline-flex items-center gap-2 text-xs text-zinc-300">
              <Move3d className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                Gira en 3D y toca cualquier punto luminoso
              </span>
            </div>

            {/* 3D Camera Controls (Zoom In, Zoom Out, Auto-Orbit, Reset) */}
            <div className="flex items-center gap-1 bg-zinc-950/90 border border-zinc-800 p-1 rounded-xl shadow">
              <button
                type="button"
                onClick={() => handleZoom(0.25)}
                title="Acercar (Zoom In)"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-zinc-400 px-1.5 tabular-nums">
                {zoomDisplay}%
              </span>
              <button
                type="button"
                onClick={() => handleZoom(-0.25)}
                title="Alejar (Zoom Out)"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                title="Alternar giro automático 3D"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  autoRotate
                    ? "bg-amber-400/20 text-amber-300"
                    : "hover:bg-zinc-800 text-zinc-400"
                }`}
              >
                <Compass className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetCamera}
                title="Centrar cámara 3D"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Unobstructed 3D Canvas Viewport */}
          <div className="relative w-full h-[360px] sm:h-[430px] rounded-2xl bg-[#06070b] border border-zinc-800/90 overflow-hidden select-none">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
            />

            {/* Compact Color Legend at Bottom of Canvas */}
            <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-zinc-950/75 border border-zinc-800/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-zinc-400 w-fit mx-auto">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                Hot Wheels
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                Flores
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Aniversario
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Real BD
              </span>
            </div>
          </div>

          {/* Selected Node Complete Data Card (Docked cleanly below the 3D canvas so it NEVER covers the constellation!) */}
          {activeCouple && (
            <div className="rounded-2xl bg-zinc-950/95 border border-zinc-800 p-4 shadow-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {THEMES[activeCouple.theme].emoji}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {activeCouple.senderName} &amp;{" "}
                      {activeCouple.recipientName}
                    </h3>
                    {activeCouple.isLiveFromDb && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shrink-0">
                        <Crown className="w-2.5 h-2.5 fill-current" />
                        <span>OFICIAL</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-400">
                    <span className="inline-flex items-center gap-1 text-zinc-200 font-medium">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      {activeCouple.city}
                    </span>
                    <span>•</span>
                    <span>{THEMES[activeCouple.theme].name}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">
                      Inicio: {activeCouple.startDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 pl-2 border-l border-zinc-800">
                <div className="text-right">
                  <span className="text-lg sm:text-2xl font-black text-amber-300 tabular-nums leading-none block">
                    {calculateDaysTogether(
                      activeCouple.startDate,
                      nowTimestamp,
                    )}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mt-0.5">
                    días juntos
                  </span>
                </div>
                <div className="hidden sm:flex w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 items-center justify-center text-rose-400">
                  <CalendarHeart className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Neural Nodes Directory & CTA */}
        <div className="lg:col-span-5 rounded-[32px] bg-zinc-900/80 border border-zinc-800/90 p-5 flex flex-col justify-between h-[540px] sm:h-[590px] shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
            <div>
              <h2 className="text-base font-bold text-white">
                Nodos de la Red ({filteredCouples.length})
              </h2>
              <p className="text-xs text-zinc-400">
                Toca una pareja para viajar en 3D hasta su nodo neuronal
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto no-scrollbar my-3 space-y-2.5 pr-1">
            {filteredCouples.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                <Search className="w-7 h-7 stroke-1" />
                <p className="text-xs">
                  No encontramos un nodo con ese nombre todavía. ¡Crea tu
                  detalle para encender tu estrella!
                </p>
              </div>
            ) : (
              filteredCouples.map((item) => {
                const isSelected = activeCouple?.id === item.id;
                const days = calculateDaysTogether(
                  item.startDate,
                  nowTimestamp,
                );
                const meta = THEMES[item.theme];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => focusNodeById(item.id)}
                    className={`w-full text-left rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-zinc-800/95 border-amber-400/60 shadow-lg"
                        : "bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{meta.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-zinc-100 truncate">
                            {item.senderName} &amp; {item.recipientName}
                          </p>
                          {item.isLiveFromDb && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase shrink-0">
                              BD Real
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          📍 {item.city} • Desde {item.startDate}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-amber-300 tabular-nums">
                        {days}
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        días
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom CTA to join the neural network */}
          <div className="pt-3 border-t border-zinc-800 space-y-2.5">
            <button
              type="button"
              onClick={() => onStartBuilding()}
              className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-zinc-950 shadow-xl shadow-orange-500/20 hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer shimmer-btn"
            >
              <Sparkles className="w-4 h-4" />
              <span>¡Conectar nuestra historia a la Red 3D!</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
