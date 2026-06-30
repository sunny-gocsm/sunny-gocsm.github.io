// Shared video-ref helpers.
// videoRef shape:
//   undefined | "default"  → use GoCSM's white-label tutorial
//   "link:<url>"           → custom URL from the agency (YouTube/Vimeo/Loom)

export type VideoProvider = "youtube" | "vimeo" | "loom";

export const PROVIDER_LABEL: Record<VideoProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  loom: "Loom",
};

export function detectProvider(url: string): VideoProvider | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") return "youtube";
    if (host === "vimeo.com" || host === "player.vimeo.com") return "vimeo";
    if (host === "loom.com") return "loom";
    return null;
  } catch {
    return null;
  }
}

export type ParsedVideoRef =
  | { kind: "default" }
  | { kind: "link"; url: string; provider: VideoProvider | null };

export function parseVideoRef(ref?: string): ParsedVideoRef {
  if (!ref || ref === "default") return { kind: "default" };
  if (ref.startsWith("link:")) {
    const url = ref.slice(5);
    return { kind: "link", url, provider: detectProvider(url) };
  }
  // Legacy "custom:..." stub had no real URL — treat as default.
  return { kind: "default" };
}

/** Seeded white-label tutorial used when a step has no custom video. Placeholder until real assets ship. */
export const GOCSM_TUTORIAL_EMBED = "https://www.youtube.com/embed/aqz-KE-bpKQ";

/** Convert a watch URL into an embeddable iframe src. Returns null when no provider/ID could be derived. */
export function toEmbedUrl(url: string): string | null {
  const provider = detectProvider(url);
  if (!provider) return null;
  try {
    const u = new URL(url.trim());
    if (provider === "youtube") {
      if (u.hostname.replace(/^www\./, "") === "youtu.be") {
        const id = u.pathname.slice(1).split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
      return null;
    }
    if (provider === "vimeo") {
      const m = u.pathname.match(/\/video\/(\d+)/) || u.pathname.match(/\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
      return null;
    }
    if (provider === "loom") {
      const m = u.pathname.match(/\/(?:share|embed)\/([^/?#]+)/);
      if (m) return `https://www.loom.com/embed/${m[1]}`;
      return null;
    }
    return null;
  } catch {
    return null;
  }
}
