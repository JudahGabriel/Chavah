namespace BitShuva.Chavah {
    export class SongApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        getSong(): ng.IPromise<Song> {
            return this.httpApi.query("/api/songs/get", null, SongApiService.songConverter);
        }

        getSongBatch(): ng.IPromise<Song[]> {
            return this.httpApi.query("/api/songs/batch", null, SongApiService.songListConverter);
        }

        getSongById(id: string): ng.IPromise<Song> {
            return this.httpApi.query("/api/songs/id", { songId: id }, SongApiService.songConverter);
        }

        getSongByArtistAndAlbum(artist: string, album: string): ng.IPromise<Song> {
            var url = "/api/songs/getSongByArtistAndAlbum";
            var args = {
                artist: artist,
                album: album
            };

            return this.httpApi.query(url, args, SongApiService.songConverter);
        }

        getSongByAlbum(album: string): ng.IPromise<Song> {
            var url = "/api/songs/album/";
            var args = {
                album: album
            };

            return this.httpApi.query(url, args, SongApiService.songConverter);
        }

        getSongByArtist(artist: string): ng.IPromise<Song> {
            var url = "/api/songs/artist/";
            var args = {
                album: artist
            };

            return this.httpApi.query(url, args, SongApiService.songConverter);
        }

        getSongMatches(searchText: string): ng.IPromise<Song[]> {
            var url = "/api/songs/search";
            var args = {
                searchText: searchText
            };

            return this.httpApi.query(url, args, SongApiService.songListConverter);
        }

        private static songListConverter(songs: Server.ISong[]): Song[] {
            return songs.map(r => SongApiService.songConverter(r));
        }

        private static songConverter(raw: Server.ISong): Song {
            return new Song(raw);
        }
    }

    App.service("songApi", SongApiService);
}