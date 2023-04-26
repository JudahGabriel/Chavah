import { PagedResult } from "./paged-result";
declare type GetPagedResultsFunc<T> = (skip: number, take: number) => Promise<PagedResult<T>>;
export declare class PagedList<T> {
    private readonly nextChunkFetcher;
    totalCount: number | null;
    skip: number;
    take: number;
    hasMoreItems: boolean;
    isLoading: boolean;
    readonly items: T[];
    private changedListeners;
    constructor(nextChunkFetcher: GetPagedResultsFunc<T>);
    addEventListener(eventName: "changed", handler: () => void): void;
    getNextChunk(): Promise<void>;
    notifyChanged(): void;
}
export {};
