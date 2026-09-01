import { Subject } from "./reactive-store";
import type { PagedList as ServerPagedList } from "../models/server-interfaces";

/**
 * A list that fetches chunks of items at a time, with optional local-storage
 * caching. Ported from `wwwroot/js/common/PagedList.ts`: the AngularJS
 * `ng.IPromise` return type becomes a native `Promise`, and a `changed`
 * observable replaces the AngularJS digest cycle so Lit components can
 * re-render when items load or paging state changes.
 */
export class PagedList<T> {
  skip = 0;
  take = 10;
  items: T[] = [];
  itemsTotalCount: number | null = null;
  isLoading = false;
  noItemsText = "There are no results";

  /** Emits after any mutation that affects rendering. */
  readonly changed = new Subject<void>();

  constructor(
    private readonly fetcher: (skip: number, take: number) => Promise<ServerPagedList<T>>,
    private readonly cacheKey?: string,
    private readonly afterFetch?: (items: T[]) => void,
  ) {
    if (cacheKey) {
      this.rehydrateCachedItems(cacheKey);
    }
  }

  reset(): void {
    this.skip = 0;
    this.items.length = 0;
    this.itemsTotalCount = null;
    this.isLoading = false;
    this.changed.next();
  }

  resetAndFetch(): void {
    this.reset();
    this.fetchNextChunk();
  }

  /** Reloads the current chunk. */
  refresh(): void {
    if (!this.isLoading) {
      this.skip -= this.items.length;
      this.fetchNextChunk();
    }
  }

  fetchNextChunk(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.changed.next();

    const skip = this.skip;
    this.fetcher(skip, this.take)
      .then((results) => {
        if (this.isLoading) {
          // If skip is zero, we're fetching the first chunk. Clear items because
          // we may have added items when rehydrating the cache.
          if (this.cacheKey && skip === 0) {
            this.items.length = 0;
            this.cacheItems(this.cacheKey, results.items);
          }

          this.items.push(...results.items);
          this.itemsTotalCount = results.total;
          this.skip += results.items.length;

          if (this.afterFetch) {
            this.afterFetch(this.items);
          }
        }
      })
      .finally(() => {
        this.isLoading = false;
        this.changed.next();
      });
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

  private rehydrateCachedItems(cacheKey: string): void {
    try {
      const cachedJson = window.localStorage.getItem(cacheKey);
      if (cachedJson) {
        this.items = JSON.parse(cachedJson) as T[];
        if (this.afterFetch) {
          this.afterFetch(this.items);
        }
        this.changed.next();
      }
    } catch (error) {
      console.log("Failed to rehydrate cached items for cacheKey", cacheKey, error);
    }
  }

  private cacheItems(cacheKey: string, items: T[]): void {
    try {
      const itemsJson = JSON.stringify(items);
      window.localStorage.setItem(cacheKey, itemsJson);
    } catch (error) {
      console.log("Unable to cache list of items with cache key", cacheKey, items, error);
    }
  }
}
