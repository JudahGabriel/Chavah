/**
 * A list that fetches its items asynchronously, with optional local-storage caching.
 *
 * Ported from `wwwroot/js/common/List.ts`: the AngularJS `ng.IPromise` return
 * types become native `Promise`s and lodash's `_.pull` is replaced with a manual
 * splice loop. A `changed` observable replaces the AngularJS digest cycle so Lit
 * components can re-render when items load or state changes.
 */
import { Subject } from "./reactive-store";

export class List<T> {
  items: T[] = [];
  hasLoaded = false;
  isLoading = false;
  noItemsText = "There are no results";

  /** Emits after any mutation that affects rendering (load, reset, remove). */
  readonly changed = new Subject<void>();

  /**
   * @param fetcher The function that fetches the items from the server.
   * @param cacheKey Optional cache key used to store/read the items from local storage.
   * @param cacheSelector Optional selector that rehydrates an item read from storage.
   *   If omitted, the raw JSON object read from storage is used as the item.
   * @param afterLoadProcessor Optional callback invoked with the loaded items.
   */
  constructor(
    private readonly fetcher: () => Promise<T[]>,
    private readonly cacheKey?: string,
    readonly cacheSelector?: (rawJsonObj: any) => T,
    private afterLoadProcessor?: (results: T[]) => void,
  ) {
    if (cacheKey) {
      this.rehydrateCachedItems(cacheKey, cacheSelector);
    }
  }

  reset(): void {
    this.items.length = 0;
    this.isLoading = false;
    this.changed.next();
  }

  resetAndFetch(): void {
    this.reset();
    this.fetch();
  }

  fetch(): Promise<T[]> | null {
    if (!this.isLoading) {
      this.isLoading = true;
      this.hasLoaded = false;
      this.changed.next();
      const task = this.fetcher();
      task
        .then((results) => {
          if (this.isLoading) {
            this.items.length = 0;
            this.items.push(...results);

            if (this.afterLoadProcessor) {
              this.afterLoadProcessor(results);
            }

            if (this.cacheKey) {
              setTimeout(() => this.cacheItems(this.cacheKey!, results), 0);
            }
          }
          this.hasLoaded = true;
        })
        .finally(() => {
          this.isLoading = false;
          this.changed.next();
        });
      return task;
    }

    return null;
  }

  remove(item: T): boolean {
    const lengthBeforeRemoval = this.items.length;
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i] === item) {
        this.items.splice(i, 1);
      }
    }
    const removed = lengthBeforeRemoval > this.items.length;
    if (removed) {
      this.changed.next();
    }
    return removed;
  }

  /**
   * Writes the items into the local cache. Done automatically on load, but useful
   * for updating the cache after the items have been modified in place.
   */
  cache(): void {
    if (this.cacheKey) {
      this.cacheItems(this.cacheKey, this.items);
    }
  }

  private rehydrateCachedItems(cacheKey: string, cacheSelector?: (rawJsonObj: any) => T): void {
    try {
      const cachedJson = window.localStorage.getItem(cacheKey);
      if (cachedJson) {
        const rawItems = JSON.parse(cachedJson) as any[];
        if (cacheSelector) {
          this.items = rawItems.map((i) => cacheSelector(i));
        } else {
          this.items = rawItems;
        }

        if (this.afterLoadProcessor) {
          this.afterLoadProcessor(this.items);
        }
      }
      this.changed.next();
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
