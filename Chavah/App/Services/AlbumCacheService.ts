namespace BitShuva.Chavah {

    /**
     * A cache of albums. Used to reduce traffic to the server when we need to fetch album colors for a particular song.
     */
    export class AlbumCacheService {

        cache: Album[] = [];
        private static cacheKey = "album-art-cache";
        private static hasAttemptedRehydratedCache = false;
        songIdsWithNoAlbum: string[] = [];

        static $inject = [
            "albumApi",
            "$q"
        ];

        constructor(private albumApi: AlbumApiService, private $q: ng.IQService) {
            
        }

        getAlbumsForSongs(songs: Song[]): ng.IPromise<Album[]> {
            if (!AlbumCacheService.hasAttemptedRehydratedCache) {
                var rehydrated = AlbumCacheService.tryRehydrateCache();
                if (rehydrated) {
                    this.cache = rehydrated;
                }
            }

            var songsNeedingAlbum: Song[] = [];
            var songsWithAlbumInCache: Song[] = [];
            var albumsForSongs: Album[] = [];
            var songsToFetch = songs.filter(s => !this.songIdsWithNoAlbum.includes(s.id));
            songsToFetch.forEach(s => {
                // Do we have it in the cache? 
                var cachedAlbum = this.getAlbumForSong(s);
                if (cachedAlbum) {
                    songsWithAlbumInCache.push(s);
                    albumsForSongs.push(cachedAlbum);
                } else {
                    songsNeedingAlbum.push(s);
                }
            });

            // If everthing's in the cache, just return that.            
            var allInCache = songsNeedingAlbum.length === 0;
            if (allInCache) {
                return this.$q.resolve(albumsForSongs);
            }

            // At least some songs need their album fetched.
            var deferredResult = this.$q.defer<Album[]>();
            var songIdsNeedingAlbum = songsNeedingAlbum.map(s => s.id);
            if (songIdsNeedingAlbum.length === 0) {
                deferredResult.resolve([]);
            }
            this.albumApi.getAlbumsForSongs(songIdsNeedingAlbum)
                .then(results => {
                    deferredResult.resolve(albumsForSongs.concat(results));
                    this.addToCache(results);

                    // Are there any songs that didn't come back with an album?
                    var songsWithoutAlbumIds = songsToFetch
                        .filter(s => !this.cacheHasAlbumForSong(s))
                        .map(s => s.id);
                    this.songIdsWithNoAlbum.push(...songsWithoutAlbumIds);
                });

            return deferredResult.promise;
        }

        private getAlbumForSong(song: Song): Album | null {
            return this.cache.find(album => album.name == song.album && (album.artist === song.artist || album.isVariousArtists));
        }

        private cacheHasAlbumForSong(song: Song): boolean {
            return !!this.getAlbumForSong(song);
        }

        private addToCache(albums: Album[]) {
            var albumsNotInCache = albums.filter(a => !this.cache.some(cached => cached.id === a.id));
            this.cache.push(...albumsNotInCache);
            AlbumCacheService.tryStoreCacheInLocalStorage(this.cache);
        }

        private static tryStoreCacheInLocalStorage(cache: Album[]) {
            try {
                var data = JSON.stringify(cache);
                localStorage.setItem(AlbumCacheService.cacheKey, data);
            } catch (error) {
                console.log("Unable to save album cache to local storage.");
            }
        }

        private static tryRehydrateCache(): Album[] | null {
            AlbumCacheService.hasAttemptedRehydratedCache = true;
            try {
                var cacheJson = localStorage.getItem(AlbumCacheService.cacheKey);
                if (cacheJson) {
                    var rawCacheItems: Server.IAlbum[] = JSON.parse(cacheJson);
                    if (rawCacheItems) {
                        return rawCacheItems.map(r => new Album(r));
                    }
                }
            } catch (error) {
                console.log("Unable to rehydrate album art cache.", error);
            }

            return null;
        }
    }

    App.service("albumCache", AlbumCacheService);
}