// Phase gate for GoCSM Health — the gated/coined system (per the GoCSM product context).
//   Phase 1 (DEFAULT, no Health configured): Attention runs on HL-native signals only —
//     zero coined vocab (no score, no bands, no lifecycle). The trial state.
//   Phase 2 (after the agency sets up Health Config): health-derived signals + the richer
//     vocabulary unlock ADDITIVELY — they JOIN the same queue, never replace the native ones.
// Persists to localStorage so the chosen phase survives reloads. Defaults OFF (Phase 1).

import { useSyncExternalStore } from "react";

const STORE_KEY = "gocsm.healthConfig.v1";
type Listener = () => void;
const listeners = new Set<Listener>();

function load(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(STORE_KEY) === "1";
  } catch {
    return false;
  }
}

let configured = load();
let version = 0;

function persist() {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORE_KEY, configured ? "1" : "0");
  } catch {
    // ignore quota/serialization errors
  }
}

function emit() {
  version += 1;
  persist();
  listeners.forEach((l) => l());
}

export const healthConfigStore = {
  isConfigured() {
    return configured;
  },
  set(v: boolean) {
    if (v !== configured) {
      configured = v;
      emit();
    }
  },
  toggle() {
    configured = !configured;
    emit();
  },
  snapshot() {
    return version;
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

/** True once the agency has set up Health Config (Phase 2). Defaults false (Phase 1). */
export function useHealthConfigured(): boolean {
  useSyncExternalStore(
    (l) => healthConfigStore.subscribe(l),
    () => healthConfigStore.snapshot(),
    () => healthConfigStore.snapshot(),
  );
  return healthConfigStore.isConfigured();
}
