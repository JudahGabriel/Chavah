﻿namespace BitShuva.Chavah {
    export class ArtistApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        getAll(search = "", skip = 0, take = 1024): ng.IPromise<Server.PagedList<Server.Artist>> {
            let args = {
                search,
                skip,
                take,
            };
            return this.httpApi.query("/api/artists/getAll", args);
        }

        getByName(artistName: string): ng.IPromise<Artist> {
            let args = {
                artistName,
            };
            return this.httpApi.query("/api/artists/getByName", args, ArtistApiService.artistSelector);
        }

        save(artist: Server.Artist): ng.IPromise<Artist> {
            return this.httpApi.post("/api/artists/save", artist, ArtistApiService.artistSelector);
        }

        // tslint:disable-next-line:member-ordering
        static artistSelector(serverObj: Server.Artist): Artist {
            return new Artist(serverObj);
        }
    }

    App.service("artistApi", ArtistApiService);
}
