namespace BitShuva.Chavah {

    /**
     * A list that fetches its items asynchronously. Provides optional caching via local storage.
     */
    export class List<T> {
        items: T[] = [];
        hasLoaded = false;
        isLoading = false;
        noItemsText = "There are no results";

        /**
         * Constructs a new list.
         * @param fetcher The function that fetches the items from the server.
         * @param cacheKey Optional cache key that will store and fetch the items from local storage.
         * @param cacheSelector Optional selector function that rehydrates an item from local storage. If null or undefined, the raw JSON object read from storage will be used for the items.
         */
        constructor(
            private readonly fetcher: () => ng.IPromise<T[]>,
            private readonly cacheKey?: string,
            readonly cacheSelector?: (rawJsonObj: any) => T,
            private afterLoadProcessor?: (results: T[]) => void) {
            if (cacheKey) {
                this.rehydrateCachedItems(cacheKey, cacheSelector);
            }
        }

        reset() {
            this.items.length = 0;
            this.isLoading = false;
        }

        resetAndFetch() {
            this.reset();
            this.fetch();
        }

        fetch(): ng.IPromise<T[]> | null {
            if (!this.isLoading) {
                this.isLoading = true;
                this.hasLoaded = false;
                var task = this.fetcher();
                task
                    .then(results => {
                        if (this.isLoading) {
                            this.items = results;

                            if (this.afterLoadProcessor) {
                                this.afterLoadProcessor(results);
                            }

                            if (this.cacheKey) {
                                setTimeout(() => this.cacheItems(this.cacheKey!, results), 0);
                            }
                        }
                        this.hasLoaded = true;
                    })
                    .finally(() => this.isLoading = false);
                return task;
            }

            return null;
        }

        remove(item: T): boolean {
            var lengthBeforeRemoval = this.items.length;
            var arrayAfterRemoval = _.pull(this.items, item);
            return lengthBeforeRemoval > arrayAfterRemoval.length;
        }

        /**
         * Puts the items into the local cache. This is done automatically when the items are loaded, but calling this method can be useful for updating the cache after the items have been modified.
         */
        cache() {
            if (this.cacheKey) {
                this.cacheItems(this.cacheKey, this.items);
            }
        }

        private rehydrateCachedItems(cacheKey: string, cacheSelector?: (rawJsonObj: any) => T) {
            try {
                var cachedJson = window.localStorage.getItem(cacheKey);
                if (cachedJson) {
                    var rawItems = JSON.parse(cachedJson) as any[];
                    if (cacheSelector) {
                        this.items = rawItems.map(i => cacheSelector(i));
                    } else {
                        this.items = rawItems;
                    }

                    if (this.afterLoadProcessor) {
                        this.afterLoadProcessor(this.items);
                    }
                }
            } catch(error) {
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
            return this.hasLoaded && !this.isLoading && this.itemsTotalCount > 0;
        }

        get isLoadedAndEmpty(): boolean {
            return this.itemsTotalCount === 0 && !this.isLoading;
        }

        get itemsTotalCount(): number {
            return this.items.length;
        }
    }
}