import { ChordSheet } from "../models/interfaces";
import { PagedResult } from "../models/paged-result";
/**
 * Cache of ChordSheet objects. Used for offline search.
 */
export declare class ChordCache {
    private static readonly chordSheetDb;
    private static readonly chordStore;
    private static readonly songIndex;
    private static readonly artistIndex;
    private static readonly searchTermIndexes;
    /**
     * Adds a chord sheet to the cache.
     * @param chord The chord sheet to add.
     */
    add(chord: ChordSheet): Promise<void>;
    /**
     * Gets a chord sheet from the chord cache.
     * @param chordId The ID of the chord sheet to get.
     * @returns A chord sheet, or null if not found.
     */
    get(chordId: string): Promise<ChordSheet | null>;
    /**
     * Searches the cache for chord sheets matching the specified query.
     */
    search(query: string): Promise<ChordSheet[]>;
    /**
     * Gets chords in the cache ordered by song name.
     * @param skip The number of items to skip.
     * @param take The number of items to take.
     * @returns A paged result containing the chords ordered by name.
     */
    getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    /**
     * Loads artists by name from the cache.
     * @param artist
     * @param skip
     * @param take
     * @returns
     */
    getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    /**
     * Loads random chords from the cache.
     * @param take The maximum number of chords to load.
     * @returns
     */
    getRandom(take: number): Promise<ChordSheet[]>;
    /**
     * Gets a list of the artists for all the chord sheets.
     * @returns
     */
    getAllArtists(): Promise<string[]>;
    getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    private openDatabase;
    private createDatabase;
    private openChordsStore;
    private queryIndexes;
    private getIndexResults;
    private getIndexResultsPaged;
    private countIndexQueryTotalResults;
    private countTotalStoreResults;
    private generateRandomInteger;
    private generateRandomUniqueInts;
    private chordSheetToDbDoc;
    private getWords;
}
