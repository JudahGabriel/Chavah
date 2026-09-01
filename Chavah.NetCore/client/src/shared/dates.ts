/**
 * Date/number formatting helpers built on the web platform's `Intl` APIs,
 * replacing the app's previous dependency on moment.js.
 */

/** Coerces a Date | ISO string | epoch-millis into a Date. */
function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

const relativeFormatter =
  typeof Intl.RelativeTimeFormat === "function"
    ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    : null;

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
  ["second", 1000],
];

/** Human-friendly relative time (e.g. "3 days ago", "in 2 hours"), replacing moment's `fromNow`. */
export function fromNow(value: Date | string | number): string {
  const date = toDate(value);
  const deltaMs = date.getTime() - Date.now();
  const absMs = Math.abs(deltaMs);

  for (const [unit, unitMs] of RELATIVE_UNITS) {
    if (absMs >= unitMs || unit === "second") {
      const amount = Math.round(deltaMs / unitMs);
      if (relativeFormatter) {
        return relativeFormatter.format(amount, unit);
      }
      const abs = Math.abs(amount);
      const suffix = deltaMs < 0 ? "ago" : "from now";
      return `${abs} ${unit}${abs === 1 ? "" : "s"} ${suffix}`;
    }
  }

  return "just now";
}

/** Formats a date using `Intl.DateTimeFormat`. Defaults to a medium date + short time. */
export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  return new Intl.DateTimeFormat(undefined, options).format(toDate(value));
}

/** Formats a number using `Intl.NumberFormat` (thousands separators, etc.). */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(undefined, options).format(value);
}

/**
 * Formats a duration in seconds as `m:ss` (e.g. 75 -> "1:15"), replacing the
 * old `moment(...).format("m:ss")` used by the audio player.
 */
export function formatMinutesSeconds(totalSeconds: number): string {
  const safeSeconds =
    isNaN(totalSeconds) || !isFinite(totalSeconds) ? 0 : Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
