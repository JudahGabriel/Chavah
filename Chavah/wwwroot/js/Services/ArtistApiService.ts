namespace BitShuva.Chavah {
    export class ArtistApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        getAll(search = "", skip = 0, take = 1024): ng.IPromise<Server.PagedList<Server.Artist>> {
            const args = {
                search,
                skip,
                take,
            };
            return this.httpApi.query("/api/artists/getAll", args);
        }

        getByName(artistName: string): ng.IPromise<Artist> {
            const args = {
                artistName,
            };
            return this.httpApi.query("/api/artists/getByName", args, ArtistApiService.artistSelector);
        }

        save(artist: Server.Artist): ng.IPromise<Artist> {
            return this.httpApi.post("/api/artists/save", artist, ArtistApiService.artistSelector);
        }

        getLikedArtists(skip: number, take: number, search: string): ng.IPromise<Server.PagedList<Server.ArtistWithNetLikeCount>> {
            const args = {
                skip,
                take,
                search
            };
            return this.httpApi.query("/api/artists/getLikedArtists", args);
        }

        getDueDonations(minimum: number): ng.IPromise<Server.DueDonation[]> {
            const args = {
                minimum
            };
            return this.httpApi.query("/api/artists/getDueDonations", args);
        }

        markDueDonationAsPaid(donation: Server.DueDonation): ng.IPromise<Server.DueDonation> {
            return this.httpApi.post("/api/artists/markDueDonationAsPaid", donation);
        }

        recordMessiahsMusicFundMonthlyDisbursement(year: number, month: number, donationDollars: number): ng.IPromise<void> {
            const args = {
                year: year,
                month: month,
                donations: donationDollars
            };
            return this.httpApi.postUriEncoded("/api/artists/RecordMessiahsMusicFundMonthlyDisbursement", args);
        }

        // tslint:disable-next-line:member-ordering
        static artistSelector(serverObj: Server.Artist): Artist {
            return new Artist(serverObj);
        }
    }

    App.service("artistApi", ArtistApiService);
}
