var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * A list that fetches its items asynchronously. Provides optional caching via local storage.
         */
        var List = (function () {
            /**
             * Constructs a new list.
             * @param fetcher The function that fetches the items from the server.
             * @param cacheKey Optional cache key that will store and fetch the items from local storage.
             * @param cacheSelector Optional selector function that rehydrates an item from local storage.
             * If null or undefined, the raw JSON object read from storage will be used for the items.
             */
            function List(fetcher, cacheKey, cacheSelector, afterLoadProcessor) {
                this.fetcher = fetcher;
                this.cacheKey = cacheKey;
                this.cacheSelector = cacheSelector;
                this.afterLoadProcessor = afterLoadProcessor;
                this.items = [];
                this.hasLoaded = false;
                this.isLoading = false;
                this.noItemsText = "There are no results";
                if (cacheKey) {
                    this.rehydrateCachedItems(cacheKey, cacheSelector);
                }
            }
            List.prototype.reset = function () {
                this.items.length = 0;
                this.isLoading = false;
            };
            List.prototype.resetAndFetch = function () {
                this.reset();
                this.fetch();
            };
            List.prototype.fetch = function () {
                var _this = this;
                if (!this.isLoading) {
                    this.isLoading = true;
                    this.hasLoaded = false;
                    var task = this.fetcher();
                    task
                        .then(function (results) {
                        if (_this.isLoading) {
                            _this.items = results;
                            if (_this.afterLoadProcessor) {
                                _this.afterLoadProcessor(results);
                            }
                            if (_this.cacheKey) {
                                setTimeout(function () { return _this.cacheItems(_this.cacheKey, results); }, 0);
                            }
                        }
                        _this.hasLoaded = true;
                    })
                        .finally(function () { return _this.isLoading = false; });
                    return task;
                }
                return null;
            };
            List.prototype.remove = function (item) {
                var lengthBeforeRemoval = this.items.length;
                var arrayAfterRemoval = _.pull(this.items, item);
                return lengthBeforeRemoval > arrayAfterRemoval.length;
            };
            /**
             * Puts the items into the local cache. This is done automatically when the items are loaded,
             * but calling this method can be useful for updating the cache after the items have been modified.
             */
            List.prototype.cache = function () {
                if (this.cacheKey) {
                    this.cacheItems(this.cacheKey, this.items);
                }
            };
            List.prototype.rehydrateCachedItems = function (cacheKey, cacheSelector) {
                try {
                    var cachedJson = window.localStorage.getItem(cacheKey);
                    if (cachedJson) {
                        var rawItems = JSON.parse(cachedJson);
                        if (cacheSelector) {
                            this.items = rawItems.map(function (i) { return cacheSelector(i); });
                        }
                        else {
                            this.items = rawItems;
                        }
                        if (this.afterLoadProcessor) {
                            this.afterLoadProcessor(this.items);
                        }
                    }
                }
                catch (error) {
                    console.log("Failed to rehydrated cached items for cacheKey", cacheKey, error);
                }
            };
            List.prototype.cacheItems = function (cacheKey, items) {
                try {
                    var itemsJson = JSON.stringify(items);
                    window.localStorage.setItem(cacheKey, itemsJson);
                }
                catch (error) {
                    console.log("Unable to cache list of items with cache key", cacheKey, items, error);
                }
            };
            Object.defineProperty(List.prototype, "isLoadedWithData", {
                get: function () {
                    return this.hasLoaded && !this.isLoading && this.itemsTotalCount > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(List.prototype, "isLoadedAndEmpty", {
                get: function () {
                    return this.itemsTotalCount === 0 && !this.isLoading;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(List.prototype, "itemsTotalCount", {
                get: function () {
                    return this.items.length;
                },
                enumerable: true,
                configurable: true
            });
            return List;
        }());
        Chavah.List = List;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=List.js.map