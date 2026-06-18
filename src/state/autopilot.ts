// Tiny global store for which playbooks are "on autopilot".
// Survives within the SPA session; subscribers update via useSyncExternalStore.

import { useSyncExternalStore } from "react";

type Listener = () => void;

const ids = new Set<string>();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const autopilotStore = {
  enable(id: string) {
    if (ids.has(id)) return;
    ids.add(id);
    emit();
  },
  disable(id: string) {
    if (!ids.has(id)) return;
    ids.delete(id);
    emit();
  },
  has(id: string) {
    return ids.has(id);
  },
  snapshot(): ReadonlySet<string> {
    return ids;
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useAutopilotIds(): ReadonlySet<string> {
  return useSyncExternalStore(
    (l) => autopilotStore.subscribe(l),
    () => autopilotStore.snapshot(),
    () => autopilotStore.snapshot(),
  );
}

export function useIsAutopilot(id: string): boolean {
  const set = useAutopilotIds();
  return set.has(id);
}
