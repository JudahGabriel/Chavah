var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * A list that fetches chunks of items at a time. Provides optional caching via local storage.
         */
        var PagedList = /** @class */ (function () {
            function PagedList(fetcher, cacheKey, afterFetch) {
                this.fetcher = fetcher;
                this.cacheKey = cacheKey;
                this.afterFetch = afterFetch;
                this.skip = 0;
                this.take = 10;
                this.items = [];
                this.isLoading = false;
                this.noItemsText = "There are no results";
                if (cacheKey) {
                    this.rehydrateCachedItems(cacheKey);
                }
            }
            PagedList.prototype.reset = function () {
                this.skip = 0;
                this.items.length = 0;
                this.itemsTotalCount = null;
                this.isLoading = false;
            };
            PagedList.prototype.resetAndFetch = function () {
                this.reset();
                this.fetchNextChunk();
            };
            PagedList.prototype.fetchNextChunk = function () {
                var _this = this;
                if (!this.isLoading) {
                    this.isLoading = true;
                    var skip_1 = this.skip;
                    this.fetcher(skip_1, this.take)
                        .then(function (results) {
                        var _a;
                        if (_this.isLoading) {
                            // If skip is zero, we're fetching the first chunk.
                            // Empty array because we may have added items when rehydrating the cache.
                            var cacheKey = _this.cacheKey;
                            if (cacheKey && skip_1 === 0) {
                                _this.items.length = 0;
                                _this.cacheItems(cacheKey, results.items);
                            }
                            (_a = _this.items).push.apply(_a, results.items);
                            _this.itemsTotalCount = results.total;
                            _this.skip += results.items.length;
                            if (_this.afterFetch) {
                                _this.afterFetch(_this.items);
                            }
                        }
                    })
                        .finally(function () { return _this.isLoading = false; });
                }
            };
            PagedList.prototype.rehydrateCachedItems = function (cacheKey) {
                try {
                    var cachedJson = window.localStorage.getItem(cacheKey);
                    if (cachedJson) {
                        this.items = JSON.parse(cachedJson);
                        if (this.afterFetch) {
                            this.afterFetch(this.items);
                        }
                    }
                }
                catch (error) {
                    console.log("Failed to rehydrated cached items for cacheKey", cacheKey, error);
                }
            };
            PagedList.prototype.cacheItems = function (cacheKey, items) {
                try {
                    var itemsJson = JSON.stringify(items);
                    window.localStorage.setItem(cacheKey, itemsJson);
                }
                catch (error) {
                    console.log("Unable to cache list of items with cache key", cacheKey, items, error);
                }
            };
            Object.defineProperty(PagedList.prototype, "isLoadedWithData", {
                get: function () {
                    return this.itemsTotalCount != null && this.itemsTotalCount > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PagedList.prototype, "isLoadedAndEmpty", {
                get: function () {
                    return this.itemsTotalCount === 0 && !this.isLoading;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PagedList.prototype, "hasMoreItems", {
                get: function () {
                    return this.itemsTotalCount != null && this.itemsTotalCount > this.items.length;
                },
                enumerable: true,
                configurable: true
            });
            return PagedList;
        }());
        Chavah.PagedList = PagedList;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=PagedList.js.map