namespace BitShuva.Chavah {

    /**
     * A list that fetches chunks of items at a time. Provides optional caching via local storage.
     */
    export class PagedList<T> {
        skip = 0;
        take = 10;
        items: T[] = [];
        itemsTotalCount: number | null;
        isLoading = false;
        noItemsText = "There are no results";

        constructor(private fetcher: (skip: number, take: number) => ng.IPromise<Server.IPagedList<T>>, private readonly cacheKey?: string) {
            if (cacheKey) {
                this.rehydrateCachedItems(cacheKey);
            }
        }

        reset() {
            this.skip = 0;
            this.items.length = 0;
            this.itemsTotalCount = null;
            this.isLoading = false;
        }

        resetAndFetch() {
            this.reset();
            this.fetchNextChunk();
        }

        fetchNextChunk() {
            if (!this.isLoading) {
                this.isLoading = true;

                var skip = this.skip;
                this.fetcher(skip, this.take)
                    .then(results => {
                        if (this.isLoading) {
                            // If skip is zero, we're fetching the first chunk. 
                            // Empty array because we may have added items when rehydrating the cache.
                            var cacheKey = this.cacheKey;
                            if (cacheKey && skip === 0) {
                                this.items.length = 0;
                                this.cacheItems(cacheKey, results.items);
                            }

                            this.items.push(...results.items);
                            this.itemsTotalCount = results.total;
                            this.skip += results.items.length;
                        }
                    })
                    .finally(() => this.isLoading = false);
            }
        }

        private rehydrateCachedItems(cacheKey: string) {
            try {
                var cachedJson = window.localStorage.getItem(cacheKey);
                if (cachedJson) {
                    this.items = JSON.parse(cachedJson);
                }
            } catch (error) {
                console.log("Failed to rehydrated cached items for cacheKey", cacheKey, error);
            }
        }

        private cacheItems(cacheKey: string, items: T[]) {
            try {
                var itemsJson = JSON.stringify(items);
                window.localStorage.setItem(cacheKey, itemsJson);
            } catch (error) {
                console.log("Unable to cache list of items with cache key", cacheKey, items, error);
            }
        }

        get isLoadedWithData(): boolean {
            return this.itemsTotalCount != null && this.itemsTotalCount > 0;
        }

        get isLoadedAndEmpty(): boolean {
            return this.itemsTotalCount === 0 && !this.isLoading;
        }

        get hasMoreItems(): boolean {
            return this.itemsTotalCount != null && this.itemsTotalCount > this.items.length;
        }
    }
}