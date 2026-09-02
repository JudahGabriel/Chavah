/** Miscellaneous small helpers ported from the original `common/Utils.ts`. */

/**
 * Returns a random integer. Preserves the original formula from
 * `common/Utils.ts` where `maxInclusive` is inclusive.
 */
export function randomNumber(minInclusive: number, maxInclusive: number): number {
  return minInclusive + Math.floor(Math.random() * (maxInclusive - minInclusive + 1));
}
