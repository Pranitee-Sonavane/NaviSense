import type { Id, Point } from "./types";

/**
 * Localization abstraction boundary.
 *
 *   LocalizationService → PositionFix → Navigation UI
 *
 * The UI never learns *how* a fix was produced. Today this returns mock data;
 * a future implementation (QR, camera/CV, OCR, IMU/PDR, BLE, Wi-Fi, fusion)
 * only has to satisfy this interface. Nothing else in the app changes.
 */

export type LocalizationStatus = "idle" | "locating" | "located" | "low-confidence" | "unavailable";

export interface PositionFix {
  status: LocalizationStatus;
  /** 0–1. UI translates this into plain language, never a technical figure. */
  confidence: number;
  floorId: Id | null;
  nodeId: Id | null;
  position: Point | null;
  /** Human-readable place, e.g. "Main Entrance". */
  label: string | null;
  updatedAt: number;
}

export interface LocalizationRequest {
  /** Optional context hint from the entry point the visitor came through. */
  seedNodeId?: Id | null;
  seedFloorId?: Id | null;
  seedPosition?: Point | null;
  seedLabel?: string | null;
  /** Prototype only: force a particular outcome for demos. */
  simulate?: Exclude<LocalizationStatus, "idle" | "locating">;
}

export interface LocalizationService {
  locate(req: LocalizationRequest): Promise<PositionFix>;
}

export const IDLE_FIX: PositionFix = {
  status: "idle",
  confidence: 0,
  floorId: null,
  nodeId: null,
  position: null,
  label: null,
  updatedAt: 0,
};

/** Mock implementation used by the prototype. */
export const mockLocalizationService: LocalizationService = {
  async locate(req) {
    await new Promise((r) => setTimeout(r, 1400));
    const outcome = req.simulate ?? "located";
    const base = {
      floorId: req.seedFloorId ?? null,
      nodeId: req.seedNodeId ?? null,
      position: req.seedPosition ?? null,
      label: req.seedLabel ?? null,
      updatedAt: Date.now(),
    };
    if (outcome === "unavailable") {
      return { ...base, status: "unavailable", confidence: 0, floorId: null, nodeId: null, position: null, label: null };
    }
    if (outcome === "low-confidence") {
      return { ...base, status: "low-confidence", confidence: 0.42 };
    }
    return { ...base, status: "located", confidence: 0.93 };
  },
};

export function confidenceCopy(fix: PositionFix): { tone: "info" | "success" | "warning" | "error"; title: string; body: string } {
  switch (fix.status) {
    case "locating":
      return { tone: "info", title: "Finding your location…", body: "This usually takes a few seconds." };
    case "located":
      return { tone: "success", title: "Location found", body: fix.label ? `You are at ${fix.label}.` : "You're ready to navigate." };
    case "low-confidence":
      return {
        tone: "warning",
        title: "We're not fully sure where you are",
        body: "You can try again, scan a nearby location code, or continue anyway.",
      };
    case "unavailable":
      return {
        tone: "error",
        title: "We couldn't determine your location",
        body: "Pick your starting point manually, or scan a nearby location code.",
      };
    default:
      return { tone: "info", title: "Location not set", body: "Tap Locate me to begin." };
  }
}
