// Perceived-brightness helper replacing the AngularJS-era tinycolor().getBrightness().
// Formula matches tinycolor: (r * 299 + g * 587 + b * 114) / 1000, range 0 (black) .. 255 (white).

const namedColors: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
};

function parseColor(color: string): [number, number, number] | null {
  const c = color.trim().toLowerCase();
  const named = namedColors[c];
  if (named) {
    return named;
  }

  if (c.startsWith("#")) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((ch) => ch + ch)
        .join("");
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        return [r, g, b];
      }
    }
    return null;
  }

  const rgb = c.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const parts = rgb[1].split(",").map((p) => parseInt(p.trim(), 10));
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => !Number.isNaN(n))) {
      return [parts[0], parts[1], parts[2]];
    }
  }

  return null;
}

export function getBrightness(color: string): number {
  const rgb = parseColor(color);
  if (!rgb) {
    return 128; // Unknown color; assume mid brightness.
  }
  const [r, g, b] = rgb;
  return (r * 299 + g * 587 + b * 114) / 1000;
}
