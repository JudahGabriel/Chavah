namespace BitShuva.Chavah {
    export class SongApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        chooseSong(): ng.IPromise<Song> {
            return this.httpApi.query("/api/songs/chooseSong", null, SongApiService.songConverter);
        }

        chooseSongBatch(): ng.IPromise<Song[]> {
            return this.httpApi.query("/api/songs/chooseSongBatch", null, SongApiService.songListConverter);
        }

        getSongById(id: string, songPickReason?: SongPick): ng.IPromise<Song | null> {
            let task = this.httpApi.query("/api/songs/getById", { songId: id }, SongApiService.songOrNullConverter);
            if (songPickReason != null) {
                task.then(song => {
                    if (song) {
                        song.setSolePickReason(songPickReason);
                    }
                });
            }
            return task;
        }

        getSongByArtistAndAlbum(artist: string, album: string): ng.IPromise<Song | null> {
            let url = "/api/songs/getByArtistAndAlbum";
            const args = {
                artist,
                album,
            };

            return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
        }

        getSongByAlbum(album: string): ng.IPromise<Song | null> {
            let url = "/api/songs/getByAlbum/";
            const args = {
                album,
            };

            return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
        }

        getSongWithTag(tag: string): ng.IPromise<Song | null> {
            let url = "/api/songs/getByTag";
            const args = {
                tag,
            };

            return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
        }

        getSongByArtist(artist: string): ng.IPromise<Song | null> {
            let url = "/api/songs/getByArtist";
            const args = {
                artist,
            };

            return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
        }

        getSongMatches(searchText: string): ng.IPromise<Song[]> {
            let url = "/api/songs/search";
            const args = {
                searchText,
            };

            return this.httpApi.query(url, args, SongApiService.songListConverter);
        }

        getTrendingSongs(skip: number, take: number): ng.IPromise<Server.PagedList<Song>> {
            const args = {
                skip,
                take,
            };
            return this.httpApi.query("/api/songs/getTrending", args, SongApiService.songPagedListConverter);
        }

        getPopularSongs(count: number): ng.IPromise<Song[]> {
            const args = {
                count,
            };
            return this.httpApi.query("/api/songs/getpopular", args, SongApiService.songListConverter);
        }

        getRandomLikedSongs(count: number): ng.IPromise<Song[]> {
            const args = {
                count,
            };

            return this.httpApi.query("/api/songs/getRandomLikedSongs", args, SongApiService.songListConverter);
        }

        getLikes(skip: number, take: number, search?: string): ng.IPromise<Server.PagedList<Song>> {
            const args = {
                skip,
                take,
                search
            };

            return this.httpApi.query("/api/songs/getLikes", args, SongApiService.songPagedListConverter);
        }

        getRecentPlays(count: number): ng.IPromise<Song[]> {
            const args = {
                count,
            };

            return this.httpApi.query("/api/songs/getRecentPlays", args, SongApiService.songListConverter);
        }

        songCompleted(songId: string): ng.IPromise<any> {
            const args = {
                songId,
            };
            return this.httpApi.postUriEncoded("/api/songs/songCompleted", args);
        }

        songFailed(error: IAudioErrorInfo): ng.IPromise<any> {
            return this.httpApi.post("/api/songs/audiofailed", error);
        }

        // tslint:disable-next-line:member-ordering
        private static songPagedListConverter(dto: Server.PagedList<Server.Song>): Server.PagedList<Song> {
            return {
                items: dto.items.map(s => new Song(s)),
                skip: dto.skip,
                take: dto.take,
                total: dto.total,
            };
        }

        // tslint:disable-next-line:member-ordering
        private static songListConverter(songs: Server.Song[]): Song[] {
            return songs.map(r => SongApiService.songConverter(r));
        }

        // tslint:disable-next-line:member-ordering
        private static songOrNullConverter(raw: Server.Song | null): Song | null {
            if (raw) {
                return SongApiService.songConverter(raw);
            }

            return null;
        }

        // tslint:disable-next-line:member-ordering
        private static songConverter(raw: Server.Song): Song {
            return new Song(raw);
        }
    }

    App.service("songApi", SongApiService);
}
