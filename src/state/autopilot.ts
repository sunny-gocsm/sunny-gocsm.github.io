// Tiny global store for playbook autopilot state.
// Each playbook is in one of three states:
//   off     — no autopilot rule set
//   on      — autopilot rule active, auto-runs allowed
//   paused  — rule retained but auto-runs stopped (resumable)
//
// Survives within the SPA session; subscribers update via useSyncExternalStore.

import { useSyncExternalStore } from "react";

export type AutopilotStatus = "off" | "on" | "paused";

type Listener = () => void;

export type OverseeMode = "auto" | "ease" | "review";

const onIds = new Set<string>();
const pausedIds = new Set<string>();
const overseeMap = new Map<string, OverseeMode>();
const listeners = new Set<Listener>();

// Snapshot identity bumps on every change so useSyncExternalStore re-renders.
let version = 0;
function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

export const autopilotStore = {
  enable(id: string, oversee: OverseeMode = "auto") {
    pausedIds.delete(id);
    overseeMap.set(id, oversee);
    if (onIds.has(id)) {
      emit();
      return;
    }
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
    if (!pausedIds.has(id)) return;
    pausedIds.delete(id);
    onIds.add(id);
    emit();
  },
  has(id: string) {
    return onIds.has(id);
  },
  status(id: string): AutopilotStatus {
    if (onIds.has(id)) return "on";
    if (pausedIds.has(id)) return "paused";
    return "off";
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
