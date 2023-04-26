import { Chord } from "./chord";

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
export function createChordChartLines(chordChart: string | null): ChordChartLine[] {
    if (!chordChart) {
        return [];
    }

    const lines = chordChart.split("\n");
    return lines.map(l => createChordChartLine(l));
}

/**
 * Creates a ChordChartLine from the specified single line of text.
 * @param line The line of text
 */
function createChordChartLine(line: string | null): ChordChartLine {
    if (!line) {
        return createLyricsLine("");
    }

    // First determine if it's a chord line (e.g. "  F#m   D   A"), or if it's a lyrics line (e.g. "Lift up your voice in strength")
    Chord.chordRegex.lastIndex = 0;
    const chordMatches = line.match(Chord.chordRegex);

    // Some chord matches? If most of the line is matches or whitespace, consider it chords.
    // This is needed because some lyrics might look like chords, e.g. "Get A King" contains G and A chords, but isn't chords.
    if (chordMatches && isMostlyWhitespaceAndMatches(line, chordMatches)) {
        return createChordsLine(line, chordMatches);
    }

    return createLyricsLine(line);
}


function isMostlyWhitespaceAndMatches(line: string, matches: RegExpMatchArray): boolean {
    const whitespaceMatches = line.match(/\s/g);
    let lengthOfWhitespaceAndMatches = whitespaceMatches?.length || 0;
    for (const match of matches) {
        lengthOfWhitespaceAndMatches += match.length;
    }

    const percentageWhitespaceAndMatches = lengthOfWhitespaceAndMatches / line.length;
    return percentageWhitespaceAndMatches >= .6; // 60% whitespace and matches? It's probably a chord line.
}

function createLyricsLine(line: string): ChordChartLine {
    return {
        type: "lyrics",
        spans: [{ type: "other", value: line }]
    }
}

function createChordsLine(line: string, matches: RegExpMatchArray): ChordChartLine {

    // A chord line can contain chords and other things. E.g. "   F#m    /    A  (E)"
    // This function will return a chord line containing the required spans:
    // [
    //    { type: "other", value: "   " },
    //    { type: "chord", value: "F#m" },
    //    { type: "other", value: "    /    " },
    //    { type: "chord", value: "A" },
    //    { type: "other", value: "  (" },
    //    { type: "chord", value: "E" },
    //    { type: "other", value: ")" },
    // ]

    const spans: ChordChartSpan[] = [];
    let lineIndex = 0;
    for (const match of matches) {
        const matchIndex = line.indexOf(match, lineIndex);

        // Was there stuff before the match? Add that as a span.
        if (matchIndex > lineIndex) {
            const nonChordChars = line.substring(lineIndex, matchIndex);
            spans.push({
                type: "other",
                value: nonChordChars
            });
            lineIndex += nonChordChars.length;
        }

        spans.push({
            type: "chord",
            value: match
        });
        lineIndex += match.length;
    }

    // If we're not at the end of the line, send the rest in as a non-chord span
    if (lineIndex < line.length) {
        spans.push({
            type: "other",
            value: line.substring(lineIndex)
        });
    }

    return {
        type: "chords",
        spans: spans
    };
}