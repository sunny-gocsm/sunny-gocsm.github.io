// Client-scope accent resolution.
// Public API:
//   - normalizeHex(input): returns "#rrggbb" or null
//   - resolveAccentInk(hex): white or near-black, whichever hits >= 4.5:1 on the accent
//   - resolveAccentFill(hex): the chosen hex, deepened in HSL only if its contrast
//     vs a white panel is < 1.6:1, so the progress bar still reads as a fill

const NEAR_BLACK_INK = "#0b1220"; // matches --ink-1 family
const WHITE = "#ffffff";

export function normalizeHex(input: string): string | null {
  const v = input.trim().replace(/^#/, "");
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return null;
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  return "#" + full.toLowerCase();
}

function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex) ?? "#000000";
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(la: number, lb: number): number {
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function resolveAccentInk(hex: string): string {
  const L = luminance(hex);
  const whiteC = contrast(L, 1); // luminance of #fff = 1
  const darkC = contrast(L, luminance(NEAR_BLACK_INK));
  if (whiteC >= 4.5) return WHITE;
  if (darkC >= 4.5) return NEAR_BLACK_INK;
  // Neither hits 4.5 perfectly — pick the higher-contrast option.
  return whiteC >= darkC ? WHITE : NEAR_BLACK_INK;
}

// HSL <-> hex helpers (kept local; no external dep)
function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      default: h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

// Progress-fill threshold vs white panel. 1.6:1 is the floor where a solid
// bar still reads as "filled" against #fff without looking washed out.
export function resolveAccentFill(hex: string): string {
  const SURFACE_L = 1; // #ffffff
  if (contrast(luminance(hex), SURFACE_L) >= 1.6) return hex;
  const [r, g, b] = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  // Step lightness down in HSL, preserving hue + saturation, until threshold met.
  for (let nl = l; nl >= 0.25; nl -= 0.04) {
    const candidate = hslToHex(h, s, nl);
    if (contrast(luminance(candidate), SURFACE_L) >= 1.6) return candidate;
  }
  return hslToHex(h, s, 0.25);
}

export const BRAND_PRESETS: string[] = [
  "#0f766e", // teal
  "#7c3aed", // violet
  "#d946ef", // magenta
  "#ea7a26", // amber-orange (default)
  "#1f3a8a", // deep navy
  "#111827", // near-black
];

export const DEFAULT_BRAND_COLOR = "#ea7a26";

// Stub: stand-in for the agency's HighLevel brand color.
// Returns a deterministic value until a real HL integration is wired.
export const HL_BRAND_COLOR_STUB = "#3b82f6";
export function getHighLevelBrandColor(): string {
  return HL_BRAND_COLOR_STUB;
}
