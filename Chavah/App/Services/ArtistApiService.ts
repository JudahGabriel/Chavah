namespace BitShuva.Chavah {
    export class ArtistApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        getAll(search = "", skip = 0, take = 1024): ng.IPromise<Server.IPagedList<Server.IArtist>> {
            var args = {
                search: search,
                skip: skip,
                take: take
            };
            return this.httpApi.query("/api/artists/all", args);
        }
    }

    App.service("artistApi", ArtistApiService);
}