declare type Note = "A" | "B" | "C" | "D" | "E" | "F" | "G";
/**
 * Describes a musical chord, e.g. "A#m7/F"
 */
export declare class Chord {
    readonly fullName: string;
    readonly majorNote: Note;
    readonly minor: boolean;
    readonly sharp: boolean;
    readonly flat: boolean;
    readonly variation: string | null;
    readonly bass: Chord | null;
    private static readonly majorScaleNotes;
    private static readonly majorScaleFlatSteps;
    private static readonly minorScaleFlatSteps;
    private static readonly majorScaleSharpSteps;
    private static readonly minorScaleSharpSteps;
    static readonly chordRegex: RegExp;
    /**
     * Creates a new chord.
     * @param fullName The full name of the chord, e.g. "A#m7/C#"
     * @param majorNote The major note. For the chord, "A#m7/C#", this will be A.
     * @param minor Whether the chord is a minor chord. For "A#m7/C#", this will be true.
     * @param sharp Whether the chord is a sharp. For "A#m7/C#", this will be true.
     * @param flat Whether the chord is flat. For "A#m7/C#", this will be false.
     * @param variation The variation on the chord. For "A#m7/C#", the variation will be "7".
     * @param bass The bass note of the chord. For "A#m7/C#", this will be a new Chord object containing "C#"
     */
    constructor(fullName: string, majorNote: Note, minor: boolean, sharp: boolean, flat: boolean, variation: string | null, bass: Chord | null);
    static tryParse(input?: string): Chord | null;
    /**
     * Creates a new Chord that is transformed the specified number of half-steps.
     * @param halfSteps The number of half-steps to transpose.
     * @returns A new transposed chord.
     */
    transpose(halfSteps: number): Chord;
}
export {};
