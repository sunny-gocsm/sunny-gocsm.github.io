// Step-in notification & escalation config — how the agency owner wants to be told when a
// playbook fails / an account still needs a human, so he isn't forced to visit /today daily.
// Operator-grade (Linear channel-toggles + GitHub scheduled-reminder model), NOT a rules engine:
// one channel × cadence choice + "also notify the account's owner". Slack/Asana are external
// handoffs (like the HighLevel handoff) — "Connect" is a prototype stub; Email needs no connect.
// Persists to localStorage. Defaults: low-noise (daily digest · email · owner off · nothing connected).

import { useSyncExternalStore } from "react";

export type NotifyChannel = "slack" | "email" | "asana";
export type NotifyCadence = "digest" | "each";

export interface NotifyConfig {
  configured: boolean; // has the user explicitly turned the digest ON? (the adaptive-hierarchy signal —
  // channels is pre-filled with "email" as an endowed default, so it can't double as the on/off signal)
  channels: NotifyChannel[]; // where Step-in alerts go (multi-select)
  cadence: NotifyCadence; // "digest" = one daily summary; "each" = the moment it happens (realtime)
  digestTime: string; // e.g. "9:00am" — only meaningful when cadence === "digest"
  notifyOwner: boolean; // also loop in the sub-account's owner
  connected: Record<"slack" | "asana", boolean>; // external-handoff connection stubs
}

const STORE_KEY = "gocsm.notify.v1";
const DEFAULT: NotifyConfig = {
  configured: false,
  channels: ["email"],
  cadence: "digest",
  digestTime: "9:00am",
  notifyOwner: false,
  connected: { slack: false, asana: false },
};

type Listener = () => void;
const listeners = new Set<Listener>();

function load(): NotifyConfig {
  try {
    if (typeof localStorage === "undefined") return DEFAULT;
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULT;
    const p = JSON.parse(raw) as Partial<NotifyConfig>;
    return { ...DEFAULT, ...p, connected: { ...DEFAULT.connected, ...(p.connected ?? {}) } };
  } catch {
    return DEFAULT;
  }
}

let config = load();
let version = 0;

function persist() {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORE_KEY, JSON.stringify(config));
  } catch {
    // ignore quota/serialization errors
  }
}
function emit() {
  version += 1;
  persist();
  listeners.forEach((l) => l());
}

export const notifyStore = {
  get(): NotifyConfig {
    return config;
  },
  set(patch: Partial<NotifyConfig>) {
    config = { ...config, ...patch };
    emit();
  },
  toggleChannel(ch: NotifyChannel) {
    const on = config.channels.includes(ch);
    config = { ...config, channels: on ? config.channels.filter((c) => c !== ch) : [...config.channels, ch] };
    emit();
  },
  turnOn() {
    // One-tap enable — keep (or seed) the endowed email default, then mark configured.
    config = { ...config, configured: true, channels: config.channels.length ? config.channels : ["email"] };
    emit();
  },
  turnOff() {
    config = { ...config, configured: false };
    emit();
  },
  connect(ch: "slack" | "asana") {
    config = { ...config, connected: { ...config.connected, [ch]: true } };
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

export function useNotifyConfig(): NotifyConfig {
  useSyncExternalStore(
    (l) => notifyStore.subscribe(l),
    () => notifyStore.snapshot(),
    () => notifyStore.snapshot(),
  );
  return notifyStore.get();
}
