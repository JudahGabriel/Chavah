namespace BitShuva.Chavah {
    export class RecentController {

        static $inject = [
            "songApi",
            "$q",
            "appNav"
        ];

        songsList = new PagedList((skip, take) => this.getRecentSongsAsPagedList(skip, take));

        constructor(
            private readonly songApi: SongApiService,
            private readonly $q: ng.IQService,
            private readonly appNav: AppNavService) {
        }

        $onInit() {
            this.songsList.take = 25;
            this.songsList.fetchNextChunk();
        }

        getRecentSongsAsPagedList(skip: number, take: number): ng.IPromise<Server.PagedList<Song>> {
            // Getting recent songs returns a plain array, because we only
            // keep 10 or song recent songs for each user.
            // Since it's not actually a paged list, we convert
            // the list of songs to a paged list here.
            const deferred = this.$q.defer<Server.PagedList<Song>>();
            this.songApi.getRecentPlays(this.songsList.take)
                .then(results => {
                    const pagedResults: Server.PagedList<Song> = {
                        items: results,
                        skip: skip,
                        take: take,
                        total: results.length
                    };
                    deferred.resolve(pagedResults);
                });
            return deferred.promise;
        }
    }

    App.controller("RecentController", RecentController);
}
