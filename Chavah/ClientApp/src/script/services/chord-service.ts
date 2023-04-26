import { ChordSheet } from "../models/interfaces";
import { PagedResult } from "../models/paged-result";
import { ApiServiceBase } from "./api-service-base";
import type { ChordCache } from "./chord-cache"; // Import types only for now, as we only use the real module if we're offline.
import { ChordFetchBackend } from "./chord-fetch-backend";

export class ChordService extends ApiServiceBase {

    private backend: ChordFetchBackend | null = null;

    constructor() {
        super();
    }

    getById(chordId: string): Promise<ChordSheet> {
        return this.getBackend().then(b => b.getById(chordId));
    }

    getByOrderedIndex(index: number): Promise<string | null> {
        return this.getBackend().then(b => b.getByOrderedIndex(index));
    }

    search(query: string): Promise<ChordSheet[]> {
        return this.getBackend().then(b => b.search(query));
    }

    getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        return this.getBackend().then(b => b.getBySongName(skip, take));
    }

    getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        return this.getBackend().then(b => b.getByArtistName(artist, skip, take));
    }

    getByRandom(take: number): Promise<ChordSheet[]> {
        return this.getBackend().then(b => b.getByRandom(take));
    }

    getAllArtists(): Promise<string[]> {
        return this.getBackend().then(b => b.getAllArtists());
    }

    getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        return this.getBackend().then(b => b.getNew(skip, take));
    }

    downloadUrlFor(chord: ChordSheet): string {
        if (chord.downloadUrl) {
            return chord.downloadUrl;
        }

        return `${this.apiUrl}/chords/download?id=${chord.id}`;
    }

    submitChordEdit(chord: ChordSheet, attachments: File[]): Promise<void> {
        return this.getBackend().then(b => b.submitChordEdit(chord, attachments));
    }

    private async getBackend(): Promise<ChordFetchBackend> {
        if (this.backend) {
            return this.backend;
        }

        const module = await import("./online-detector");
        const detector = new module.OnlineDetector();
        const isOnline = await detector.checkOnline();
        this.backend = isOnline ?
            new ApiBackend() :
            new CacheBackend();
        return this.backend;
    }
}

/**
 * An implementation of ChordFetchBackend that talks to the API. Used when online.
 */
 class ApiBackend extends ApiServiceBase implements ChordFetchBackend {

    async getById(chordId: string): Promise<ChordSheet> {
        return super.getJson("/chords/get", { id: chordId });
    }

    getByOrderedIndex(index: number): Promise<string | null> {
        return super.getString("/chords/getByOrderedIndex", { index: index });
    }

    search(query: string): Promise<ChordSheet[]> {
        return super.getJson("/chords/search", { search: query });
    }

    getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args = {
            skip,
            take
        };
        return super.getJson("/chords/getBySongName", args);
    }

    getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args: any = {
            skip,
            take
        };
        const url = artist ? "/chords/getArtistSongs" : "/chords/getByArtistName";
        if (artist) {
            args.artist = artist;
        }
        return super.getJson(url, args);
    }

    getByRandom(take: number): Promise<ChordSheet[]> {
        const args = {
            take
        };
        return super.getJson("/chords/getByRandom", args);
    }

    getAllArtists(): Promise<string[]> {
        return super.getJson("/chords/getAllArtists");
    }

    async getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const args = {
            skip,
            take
        };
        return super.getJson("/chords/getNew", args);
    }

    downloadUrlFor(chord: ChordSheet): string {
        if (!chord.chords && chord.downloadUrl) {
            return chord.downloadUrl;
        }

        return `${this.apiUrl}/chords/download?id=${chord.id}`;
     }

     submitChordEdit(chord: ChordSheet, attachments: File[]): Promise<void> {
        // Create a new form to hold all the chord props and attachments.
        const formData = new FormData();
        const chordProps = Object.entries(chord);
        for (let [prop,val] of chordProps) {
            if (val !== null && val !== undefined) {
                // Is it an array? Append all array values to the form.
                const arrayVal = Array.isArray(val) ? val as Array<unknown> : null;
                if (arrayVal) {
                    arrayVal.forEach(v => formData.append(prop, `${v}`))
                } else {
                    formData.append(prop, `${val}`);
                }
            }
        }

        if (attachments.length > 0) {
            attachments.forEach(a => formData.append("attachments", a, a.name));
        }

        return super.postFormData("/chords/submitEdit", formData);
    }
}

/**
 * Implementation of ChordFetchService that loads chords from the local Chord Cache. Intended for use when offline.
 */
class CacheBackend implements ChordFetchBackend {
    private chordCache: ChordCache | null = null;

    async getById(chordId: string): Promise<ChordSheet> {
        const cache = await this.getChordCache();
        const chord = await cache.get(chordId);
        if (!chord) {
            throw new Error("Couldn't find chord in cache");
        }

        return chord;
    }

    getByOrderedIndex(index: number): Promise<string | null> {
        throw new Error(`getByOrderedIndex(${index}) is intended for online use only.`);
    }

    async search(query: string): Promise<ChordSheet[]> {
        const cache = await this.getChordCache();
        return await cache.search(query);
    }

    async getBySongName(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const cache = await this.getChordCache();
        return await cache.getBySongName(skip, take);
    }

    async getByArtistName(artist: string | null, skip: number, take: number): Promise<PagedResult<ChordSheet>> {
                const cache = await this.getChordCache();
        return await cache.getByArtistName(artist, skip, take);
    }

    async getByRandom(take: number): Promise<ChordSheet[]> {
        const cache = await this.getChordCache();
        return await cache.getRandom(take);
    }

    async getAllArtists(): Promise<string[]> {
        const cache = await this.getChordCache();
        return await cache.getAllArtists();
    }

    async getNew(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const cache = await this.getChordCache();
        return cache.getNew(skip, take);
    }

    async getChordCache(): Promise<ChordCache> {
        if (!this.chordCache) {
            const module = await import("./chord-cache");
            this.chordCache = new module.ChordCache();
        }

        return this.chordCache;
    }

    // @ts-ignore
    submitChordEdit(chord: ChordSheet, attachments: File[]): Promise<void> {
        throw new Error("Can't upload chords while offline.");
    }
}