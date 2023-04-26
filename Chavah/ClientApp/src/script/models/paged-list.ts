import { PagedResult } from "./paged-result";

type GetPagedResultsFunc<T> = (skip: number, take: number) => Promise<PagedResult<T>>;

export class PagedList<T> {

    totalCount: number | null = null;
    skip = 0
    take = 25;
    hasMoreItems = false;
    isLoading = false;
    readonly items: T[] = [];
    private changedListeners: (() => void)[] = [];

    constructor(
        private readonly nextChunkFetcher: GetPagedResultsFunc<T>) {
    }

    addEventListener(eventName: "changed", handler: () => void) {
        if (eventName === "changed") {
            this.changedListeners.push(handler);
        }
    }

    async getNextChunk(): Promise<void> {
        // If we're already loading the next chunk, return that.
        if (this.isLoading) {
            return Promise.reject("Already loading next chunk");
        }

        this.isLoading = true;
        this.notifyChanged();

        try {
            const chunk = await this.nextChunkFetcher(this.skip, this.take);
            this.items.push(...chunk.results);
            this.skip += chunk.results.length;
            this.hasMoreItems = this.items.length < chunk.totalCount;
        } finally {
            this.isLoading = false;
            this.notifyChanged();
        }
    }

    notifyChanged() {
        this.changedListeners.forEach(l => l());
    }
}