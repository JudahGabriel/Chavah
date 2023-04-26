import { ChordSheet } from "../models/interfaces";
import { PagedResult } from "../models/paged-result";
import { ApiServiceBase } from "./api-service-base";
export declare class ChordService extends ApiServiceBase {
    private backend;
    constructor();
    getById(chordId: string): Promise<ChordSheet>;
    getByOrderedIndex(index: number): Promise<string | null>;
    search(query: string): Promise<ChordSheet[]>;
    getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    getByRandom(take: number): Promise<ChordSheet[]>;
    getAllArtists(): Promise<string[]>;
    getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    downloadUrlFor(chord: ChordSheet): string;
    submitChordEdit(chord: ChordSheet, attachments: File[]): Promise<void>;
    private getBackend;
}
