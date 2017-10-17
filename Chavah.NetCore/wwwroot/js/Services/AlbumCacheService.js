var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * A cache of albums. Used to reduce traffic to the server when we need to fetch album colors for a particular song.
         */
        var AlbumCacheService = (function () {
            function AlbumCacheService(albumApi, $q) {
                this.albumApi = albumApi;
                this.$q = $q;
                this.cache = [];
            }
            AlbumCacheService.prototype.getAlbumsForSongs = function (songs) {
                var _this = this;
                if (!AlbumCacheService.hasAttemptedRehydratedCache) {
                    var rehydrated = AlbumCacheService.tryRehydrateCache();
                    if (rehydrated) {
                        this.cache = rehydrated;
                    }
                }
                var albumIdCacheMisses = [];
                var albumsForSongs = [];
                var albumIdsToFetch = _.uniq(songs
                    .filter(function (s) { return !!s.albumId; })
                    .map(function (s) { return s.albumId; }));
                albumIdsToFetch.forEach(function (albumId) {
                    // Do we have it in the cache? 
                    var cachedAlbum = _this.getCachedAlbum(albumId);
                    if (cachedAlbum) {
                        albumsForSongs.push(cachedAlbum);
                    }
                    else {
                        albumIdCacheMisses.push(albumId);
                    }
                });
                // If everthing's in the cache, just return that.            
                var allInCache = albumIdCacheMisses.length === 0;
                if (allInCache) {
                    return this.$q.resolve(albumsForSongs);
                }
                // At least some songs need their album fetched.
                var deferredResult = this.$q.defer();
                this.albumApi.getAlbums(_.uniq(albumIdCacheMisses))
                    .then(function (results) {
                    _this.addToCache(results);
                    deferredResult.resolve(albumsForSongs.concat(results));
                });
                return deferredResult.promise;
            };
            AlbumCacheService.prototype.getCachedAlbum = function (albumId) {
                var albumIdLowered = albumId.toLowerCase();
                return this.cache.find(function (album) { return album.id.toLowerCase() === albumIdLowered; });
            };
            AlbumCacheService.prototype.addToCache = function (albums) {
                var _this = this;
                var albumsNotInCache = albums.filter(function (a) { return !_this.cache.some(function (cached) { return cached.id === a.id; }); });
                (_a = this.cache).push.apply(_a, albumsNotInCache);
                AlbumCacheService.tryStoreCacheInLocalStorage(this.cache);
                var _a;
            };
            AlbumCacheService.tryStoreCacheInLocalStorage = function (cache) {
                try {
                    var data = JSON.stringify(cache);
                    localStorage.setItem(AlbumCacheService.cacheKey, data);
                }
                catch (error) {
                    console.log("Unable to save album cache to local storage.");
                }
            };
            AlbumCacheService.tryRehydrateCache = function () {
                AlbumCacheService.hasAttemptedRehydratedCache = true;
                try {
                    var cacheJson = localStorage.getItem(AlbumCacheService.cacheKey);
                    if (cacheJson) {
                        var rawCacheItems = JSON.parse(cacheJson);
                        if (rawCacheItems) {
                            return rawCacheItems.map(function (r) { return new Chavah.Album(r); });
                        }
                    }
                }
                catch (error) {
                    console.log("Unable to rehydrate album art cache.", error);
                }
                return null;
            };
            return AlbumCacheService;
        }());
        AlbumCacheService.cacheKey = "album-art-cache";
        AlbumCacheService.hasAttemptedRehydratedCache = false;
        AlbumCacheService.$inject = [
            "albumApi",
            "$q"
        ];
        Chavah.AlbumCacheService = AlbumCacheService;
        Chavah.App.service("albumCache", AlbumCacheService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
