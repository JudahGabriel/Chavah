export interface ChordChartLine {
    type: "chords" | "lyrics";
    spans: ChordChartSpan[];
}
export interface ChordChartSpan {
    type: "chord" | "other";
    value: string;
}
/**
 * Creates a list of ChordChartLines from the specified chord text.
 * @param chordChart
 * @returns An array of ChordChartLine.
 */
export declare function createChordChartLines(chordChart: string | null): ChordChartLine[];
