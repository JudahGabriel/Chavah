namespace BitShuva.Chavah {

    /**
     * A cache of albums. Used to reduce traffic to the server when we need to fetch album colors for a particular song.
     */
    export class AlbumCacheService {

        static $inject = [
            "albumApi",
            "$q",
        ];

        private static cacheKey = "album-art-cache";
        private static hasAttemptedRehydratedCache = false;

        cache: Album[] = [];

        constructor(private albumApi: AlbumApiService, private $q: ng.IQService) {

        }

        getAlbumsForSongs(songs: Song[]): ng.IPromise<Album[]> {
            if (!AlbumCacheService.hasAttemptedRehydratedCache) {
                let rehydrated = AlbumCacheService.tryRehydrateCache();
                if (rehydrated) {
                    this.cache = rehydrated;
                }
            }

            let albumIdCacheMisses: string[] = [];
            let albumsForSongs: Album[] = [];
            let albumIdsToFetch = _.uniq(songs
                .filter(s => !!s.albumId)
                .map(s => s.albumId!));
            albumIdsToFetch.forEach(albumId => {
                // Do we have it in the cache?
                let cachedAlbum = this.getCachedAlbum(albumId);
                if (cachedAlbum) {
                    albumsForSongs.push(cachedAlbum);
                } else {
                    albumIdCacheMisses.push(albumId);
                }
            });

            // If everthing's in the cache, just return that.
            let allInCache = albumIdCacheMisses.length === 0;
            if (allInCache) {
                return this.$q.resolve(albumsForSongs);
            }

            // At least some songs need their album fetched.
            let deferredResult = this.$q.defer<Album[]>();
            this.albumApi.getAlbums(_.uniq(albumIdCacheMisses))
                .then(results => {
                    this.addToCache(results);
                    deferredResult.resolve(albumsForSongs.concat(results));
                });

            return deferredResult.promise;
        }

        private getCachedAlbum(albumId: string): Album | null {
            let albumIdLowered = albumId.toLowerCase();
            return this.cache.find(album => album.id.toLowerCase() === albumIdLowered);
        }

        private addToCache(albums: Album[]) {
            let albumsNotInCache = albums.filter(a => !this.cache.some(cached => cached.id === a.id));
            this.cache.push(...albumsNotInCache);
            AlbumCacheService.tryStoreCacheInLocalStorage(this.cache);
        }

        // tslint:disable-next-line:member-ordering
        private static tryStoreCacheInLocalStorage(cache: Album[]) {
            try {
                let data = JSON.stringify(cache);
                localStorage.setItem(AlbumCacheService.cacheKey, data);
            } catch (error) {
                console.log("Unable to save album cache to local storage.");
            }
        }

        // tslint:disable-next-line:member-ordering
        private static tryRehydrateCache(): Album[] | null {
            AlbumCacheService.hasAttemptedRehydratedCache = true;
            try {
                let cacheJson = localStorage.getItem(AlbumCacheService.cacheKey);
                if (cacheJson) {
                    let rawCacheItems: Server.Album[] = JSON.parse(cacheJson);
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
