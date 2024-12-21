namespace BitShuva.Chavah {
    /**
     * Generates a random number between minInclusive and maxInclusive. For example, randomNumber(1, 4) will return either 1, 2, 3, or 4.
     * @param minInclusive The minimum number. This number is inclusive and may be chosen as the random number.
     * @param maxInclusive The maximum number.This number is inclusive and may be chosen as the random number.
     * @returns The random number.
     */
    export function randomNumber(minInclusive: number, maxInclusive: number): number {
        return Math.floor(Math.random() * maxInclusive) + minInclusive;
    }
}
