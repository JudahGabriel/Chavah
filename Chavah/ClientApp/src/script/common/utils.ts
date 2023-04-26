import { ChordSheet } from "../models/interfaces";

export function emptyChordSheet(): ChordSheet {
    return {
        song: "",
        hebrewSongName: "",
        artist: "",
        chords: null,
        key: null,
        address: "",
        thumbnailUrl: "",
        downloadUrl: "",
        googleDocId: "",
        googleDocResourceKey: "",
        id: "",
        plainTextContents: null,
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        extension: null,
        hasFetchedPlainTextContents: false,
        publishUri: null,
        chavahSongId: null,
        pagesCount: 1,
        hasFetchedThumbnail: false,
        screenshots: [],
        links: [],
        authors: [],
        copyright: null,
        isSheetMusic: false,
        capo: 0,
        about: null,
        year: null,
        scripture: null,
        ccliNumber: null
    };
}

export function inputEventValue(e: InputEvent): string {
    const target = e.target as HTMLInputElement;
    return target?.value || "";
}

export function inputEventNumber(e: InputEvent): number | null {
    const target = e.target as HTMLInputElement;
    const val = target?.value || null;
    if (val === null || val === undefined) {
        return null;
    }

    const num = parseFloat(val);
    if (isNaN(num)) {
        return null;
    }

    return num;
}

export function inputEventChecked(e: InputEvent): boolean {
    const target = e.target as HTMLInputElement;
    return target?.checked === true;
}

export function bytesToText(bytes: number): string {
    const gig = 1000000000;
    if (bytes >= gig) {
        return `${Math.round(bytes / gig)}`
    }

    const meg = 1000000;
    if (bytes >= meg) {
        return `${Math.round(bytes / meg)}M`;
    }

    const kilo = 1000;
    if (bytes >= kilo) {
        return `${Math.round(bytes / kilo)}K`;
    }

    return `${bytes}B`;
}

export function guid(): string {
    const s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}