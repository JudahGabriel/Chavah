import { PagedResult } from "../models/paged-result";
import { ChordSheet } from "../models/interfaces";

/**
 * Interface for a chord sheeet fetching service.
 * We have two implementations: API (for use when online) and IndexDB cache (for use when offline).
 */
export interface ChordFetchBackend {
    getById(chordId: string): Promise<ChordSheet>;
    getByOrderedIndex(index: number): Promise<string | null>;
    search(query: string): Promise<ChordSheet[]>;
    getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    getByRandom(take: number): Promise<ChordSheet[]>;
    getAllArtists(): Promise<string[]>;
    getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    submitChordEdit(chord: ChordSheet, attachments: File[]): Promise<void>;
}