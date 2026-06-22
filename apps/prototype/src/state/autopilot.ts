// Tiny global store for playbook lifecycle state (the "Your playbooks" model).
// Each playbook is in one of four states:
//   off       — not deployed; lives in the Marketplace as an available template
//   on        — live; auto-runs allowed (autopilot)
//   paused    — deployed but unpublished/paused; rule retained, auto-runs stopped (resumable)
//   archived  — soft-removed from the active view; recoverable, run-history preserved
//
// Per the marketplace design (research-backed): we NEVER hard-delete a live or
// ever-run playbook — Pause/Unpublish → Archive is the destructive ceiling.
// Persists to localStorage so "Your playbooks" survives reloads.

import { useSyncExternalStore } from "react";

export type AutopilotStatus = "off" | "on" | "paused" | "archived";

type Listener = () => void;

export type OverseeMode = "auto" | "ease" | "review";

const STORE_KEY = "gocsm.autopilot.v1";

const onIds = new Set<string>();
const pausedIds = new Set<string>();
const archivedIds = new Set<string>();
const overseeMap = new Map<string, OverseeMode>();
const listeners = new Set<Listener>();

// ---- persistence ----------------------------------------------------------
function load() {
  try {
    const raw = typeof localStorage !== "undefined" && localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw) as {
      on?: string[]; paused?: string[]; archived?: string[]; oversee?: Record<string, OverseeMode>;
    };
    d.on?.forEach((id) => onIds.add(id));
    d.paused?.forEach((id) => pausedIds.add(id));
    d.archived?.forEach((id) => archivedIds.add(id));
    if (d.oversee) Object.entries(d.oversee).forEach(([k, v]) => overseeMap.set(k, v));
  } catch {
    // ignore corrupt store
  }
}
function persist() {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        on: [...onIds],
        paused: [...pausedIds],
        archived: [...archivedIds],
        oversee: Object.fromEntries(overseeMap),
      }),
    );
  } catch {
    // ignore quota/serialization errors
  }
}
load();

// Snapshot identity bumps on every change so useSyncExternalStore re-renders.
let version = 0;
function emit() {
  version += 1;
  persist();
  listeners.forEach((l) => l());
}

export const autopilotStore = {
  enable(id: string, oversee: OverseeMode = "auto") {
    pausedIds.delete(id);
    archivedIds.delete(id);
    overseeMap.set(id, oversee);
    onIds.add(id);
    emit();
  },
  setOversee(id: string, oversee: OverseeMode) {
    overseeMap.set(id, oversee);
    emit();
  },
  oversee(id: string): OverseeMode {
    return overseeMap.get(id) ?? "auto";
  },
  disable(id: string) {
    const had = onIds.delete(id) || pausedIds.delete(id);
    if (had) emit();
  },
  pause(id: string) {
    if (!onIds.has(id)) return;
    onIds.delete(id);
    pausedIds.add(id);
    emit();
  },
  resume(id: string) {
    if (!pausedIds.has(id) && !archivedIds.has(id)) return;
    pausedIds.delete(id);
    archivedIds.delete(id);
    onIds.add(id);
    emit();
  },
  // Soft-remove from the active view. Reversible (restore). History is preserved.
  archive(id: string) {
    onIds.delete(id);
    pausedIds.delete(id);
    archivedIds.add(id);
    emit();
  },
  restore(id: string) {
    if (!archivedIds.has(id)) return;
    archivedIds.delete(id);
    pausedIds.add(id); // restores in a safe, not-live state
    emit();
  },
  has(id: string) {
    return onIds.has(id);
  },
  status(id: string): AutopilotStatus {
    if (onIds.has(id)) return "on";
    if (pausedIds.has(id)) return "paused";
    if (archivedIds.has(id)) return "archived";
    return "off";
  },
  listOn(): string[] {
    return Array.from(onIds);
  },
  listPaused(): string[] {
    return Array.from(pausedIds);
  },
  listArchived(): string[] {
    return Array.from(archivedIds);
  },
  snapshot() {
    return version;
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

function useVersion(): number {
  return useSyncExternalStore(
    (l) => autopilotStore.subscribe(l),
    () => autopilotStore.snapshot(),
    () => autopilotStore.snapshot(),
  );
}

export function useIsAutopilot(id: string): boolean {
  useVersion();
  return autopilotStore.has(id);
}

export function useAutopilotStatus(id: string): AutopilotStatus {
  useVersion();
  return autopilotStore.status(id);
}

export function useAutopilotOversee(id: string): OverseeMode {
  useVersion();
  return autopilotStore.oversee(id);
}

// All playbook IDs currently on (not paused).
export function useAllAutopilotOn(): string[] {
  useVersion();
  return autopilotStore.listOn();
}

// Re-render helper for any surface that lists across lifecycle states.
export function useAutopilotVersion(): number {
  return useVersion();
}
