namespace BitShuva.Chavah {

    /**
     * A cache of albums. Used to reduce traffic to the server when we need to fetch album colors for a particular song.
     */
    export class AlbumCacheService {

        cache: Album[] = [];

        static $inject = [
            "albumApi",
            "$q"
        ];

        constructor(private albumApi: AlbumApiService, private $q: ng.IQService) {
            
        }

        getAlbumsForSongs(songs: Song[]): ng.IPromise<Album[]> {
            var songsNeedingAlbum: Song[] = [];
            var songsWithAlbumInCache: Song[] = [];
            var albumsForSongs: Album[] = [];
            songs.forEach(s => {
                // Do we have it in the cache? 
                var cachedAlbum = this.cache.find(a => a.name == s.album && (a.artist === s.artist || a.isVariousArtists));
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
            this.albumApi.getAlbumsForSongs(songsNeedingAlbum.map(s => s.id))
                .then(results => {
                    deferredResult.resolve(albumsForSongs.concat(results));
                    this.addToCache(results);
                });

            return deferredResult.promise;
        }

        private addToCache(albums: Album[]) {
            albums.forEach(a => {
                var isInCache = this.cache.some(cached => cached.id === a.id);
                if (!isInCache) {
                    this.cache.push(a);
                }
            })
        }
    }

    App.service("albumCache", AlbumCacheService);
}