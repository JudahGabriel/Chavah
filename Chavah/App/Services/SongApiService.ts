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

        getSongById(id: string, songPickReason?: SongPick): ng.IPromise<Song | null> {
            var task = this.httpApi.query("/api/songs/getById", { songId: id }, SongApiService.songOrNullConverter);
            if (songPickReason != null) {
                task.then(song => {
                    if (song) {
                        song.reasonPlayed = songPickReason;
                    }
                });
            }
            return task;
        }

        getSongByArtistAndAlbum(artist: string, album: string): ng.IPromise<Song | null> {
            var url = "/api/songs/getByArtistAndAlbum";
            var args = {
                artist: artist,
                album: album
            };

            return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
        }

        getSongByAlbum(album: string): ng.IPromise<Song | null> {
            var url = "/api/songs/getByAlbum/";
            var args = {
                album: album
            };

            return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
        }

        getSongByArtist(artist: string): ng.IPromise<Song | null> {
            var url = "/api/songs/getByArtist/";
            var args = {
                artist: artist
            };

            return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
        }

        getSongMatches(searchText: string): ng.IPromise<Song[]> {
            var url = "/api/songs/search";
            var args = {
                searchText: searchText
            };

            return this.httpApi.query(url, args, SongApiService.songListConverter);
        }

        getTrendingSongs(count: number): ng.IPromise<Song[]> {
            var args = {
                count: count
            };
            return this.httpApi.query("/api/songs/trending", args, SongApiService.songListConverter);
        }

        getPopularSongs(count: number): ng.IPromise<Song[]> {
            var args = {
                count: count
            };
            return this.httpApi.query("/api/songs/top", args, SongApiService.songListConverter);
        }

        getLikes(count: number): ng.IPromise<Song[]> {
            var args = {
                count: count
            };

            return this.httpApi.query("/api/songs/getRandomLikedSongs", args, SongApiService.songListConverter);
        }

        getRecentPlays(count: number): ng.IPromise<Song[]> {
            var args = {
                count: count
            };

            return this.httpApi.query("/api/songs/getRecentPlays", args, SongApiService.songListConverter);
        }

        songCompleted(songId: string): ng.IPromise<any> {
            return this.httpApi.post(`/api/songs/completed?songId=${songId}`, null);
        }

        songFailed(error: AudioErrorInfo): ng.IPromise<any> {
            return this.httpApi.post("/api/songs/audiofailed", error);
        }

        private static songListConverter(songs: Server.ISong[]): Song[] {
            return songs.map(r => SongApiService.songConverter(r));
        }

        private static songOrNullConverter(raw: Server.ISong | null): Song | null {
            if (raw) {
                return SongApiService.songConverter(raw);
            }

            return null;
        }

        private static songConverter(raw: Server.ISong): Song {
            return new Song(raw);
        }
    }

    App.service("songApi", SongApiService);
}