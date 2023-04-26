type Note = "A" | "B" | "C" | "D" | "E" | "F" | "G";
/**
 * Describes a musical chord, e.g. "A#m7/F"
 */
export class Chord {
    private static readonly majorScaleNotes = ["A", "B", "C", "D", "E", "F", "G"];
    private static readonly majorScaleFlatSteps = ["Ab", "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G"];
    private static readonly minorScaleFlatSteps = this.majorScaleFlatSteps.map(s => s + "m");
    private static readonly majorScaleSharpSteps = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    private static readonly minorScaleSharpSteps = this.majorScaleSharpSteps.map(s => s + "m");

    // 1. Optional whitespace,
    // 2. Notes A through G at least once
    // 3. Optional sharp(#) or flat(b) one or zero times
    // 4. Optional variants: one or more of these: major (maj or M), minor (m), sustained (sus), diminished (dim), add, +. Note: individual groups here have "?:"" in the beginning, meaning non-capturing group. We don't want to capture these, as we rely on an exact number of captured groups to extract the data.
    // 5. Optional variant number: 2, 5, 9, 11, 13
    // 6. Optional bass note: "/" character followed by A-G with optional sharp or flat zero or once.
    public static readonly chordRegex = new RegExp(/\s*([A-G])+([#b])?((?:maj)|(?:M)|(?:min)|m|(?:sus2)|(?:sus4)|(?:sus)|(?:dim)|(?:dim)|(?:add)|(?:dom)|(?:aug)|(?:\+))*((?:13)|(?:11)|9|7|6|5|2)*(\/[A-G]+[#b]?)?/g);

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
    constructor(
        public readonly fullName: string,
        public readonly majorNote: Note,
        public readonly minor: boolean,
        public readonly sharp: boolean,
        public readonly flat: boolean,
        public readonly variation: string | null,
        public readonly bass: Chord | null) {
    }

    static tryParse(input?: string): Chord | null {
        if (!input) {
            return null;
        }

        // Make sure we match the regex.
        var inputTrimmed = input.trim();
        Chord.chordRegex.lastIndex = 0;
        const chordRegexCaptures = Chord.chordRegex.exec(inputTrimmed);
        const expectedCaptureCount = 6; // full text match + major note + sharp or flat + variation + number + bass note
        if (!chordRegexCaptures || chordRegexCaptures.length !== expectedCaptureCount) {
            return null;
        }

        const [chordName, majorNote, sharpOrFlat, variant, variantNumber, bassNote] = chordRegexCaptures;

        // Punt if we don't have a major note.
        if (!Chord.majorScaleNotes.includes(majorNote)) {
            return null;
        }

        // Punt if the bass note is malformed.
        const baseNoteChordWithoutLeadingSlash = !!bassNote && bassNote.at(0) === "/" ? bassNote.slice(1) : bassNote;
        const bassNoteChord = Chord.tryParse(baseNoteChordWithoutLeadingSlash);
        if (bassNote && !bassNoteChord) {
            return null;
        }

        // See if the variant contains a minor note.
        // If it contains an "m" not followed by "a" (as in "major" or "maj7"), then yes, it's a minor note.
        let isMinor = false;
        let variantWithoutMinor = variant;
        if (variant) {
            const mIndex = variant.indexOf("m");
            isMinor = mIndex !== -1 && variant.at(mIndex + 1) !== "a" && variant.at(mIndex) !== "i";
            variantWithoutMinor = isMinor ? variant.slice(0, mIndex) + variant.slice(mIndex + 1) : variant;
        }

        // Combine the variant and number (e.g. maj7, sus4, etc.)
        const fullVariantWithNumbers = [variantWithoutMinor, variantNumber].filter(v => !!v).join("");

        return new Chord(chordName, majorNote as Note, isMinor, sharpOrFlat === "#", sharpOrFlat === "b", fullVariantWithNumbers, bassNoteChord);
    }

    /**
     * Creates a new Chord that is transformed the specified number of half-steps.
     * @param halfSteps The number of half-steps to transpose.
     * @returns A new transposed chord.
     */
    transpose(halfSteps: number): Chord {
        // If we're at zero, there's nothing to transpose.
        if (halfSteps === 0) {
            return this;
        }

        // Get the chord without variants or bass, e.g. "A#m7/Gb" -> "A#m".
        // This is needed becaus transposing never changes the variation.
        const chordWithoutVariants = `${this.majorNote}${this.sharp ? "#" : ""}${this.flat ? "b" : ""}${this.minor ? "m" : ""}`;

        // Scale steps: we'll use one of these to determine the next half step.
        const desiredScale = [
            Chord.majorScaleFlatSteps,
            Chord.majorScaleSharpSteps,
            Chord.minorScaleFlatSteps,
            Chord.minorScaleSharpSteps
        ].find(stepCollection => stepCollection.includes(chordWithoutVariants));
        if (!desiredScale) {
            console.warn("Couldn't transpose chord. This might mean the chord is not actually a legit chord.", this);
            return this;
        }
        const scaleIndex = desiredScale.indexOf(chordWithoutVariants);

        let nextIndex = scaleIndex;
        for (let i = 0; i < Math.abs(halfSteps); i++) {
            nextIndex += (halfSteps > 0 ? 1 : -1);

            // Scale wrap-around:
            // If we were at zero and went to -1, we want to go to the end of the array (e.g. "A" -> "G")
            // Similarly, if we were at the end of the array and went beyond it, go to the beginning (e.g. "G" -> "A")
            if (nextIndex === -1) {
                nextIndex = desiredScale.length - 1;
            } else if (nextIndex === desiredScale.length) {
                nextIndex = 0;
            }
        }

        // Put the variation back on us.
        const transposedChordWithVariants = desiredScale[nextIndex] + (this.variation || "");

        // Do we have a bass note (e.g. the "Gb" in "A#m7/Gb")? Transpose that seperately.
        const transposedBassNote = this.bass ? this.bass.transpose(halfSteps) : null;

        // Combine these strings together ("A#m7" and "Gb", joined by slash = "A#m7/Gb")
        const transposedFull = transposedChordWithVariants + (transposedBassNote ? `/${transposedBassNote.fullName}` : "");
        const transposedFullChord = Chord.tryParse(transposedFull);
        if (!transposedFullChord) {
            console.warn("Unable to transpose chord", {
                original: this,
                transposeHalfSteps: halfSteps,
                outputChordString: transposedFull
            });
            return this;
        }

        return transposedFullChord;
    }
}