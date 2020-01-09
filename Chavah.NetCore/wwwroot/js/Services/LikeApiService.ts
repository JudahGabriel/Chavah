namespace BitShuva.Chavah {
    export class LikeApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        dislikeSong(songId: string): ng.IPromise<number> {
            return this.httpApi.postUriEncoded("/api/likes/dislike", { songId: songId });
        }

        likeSong(songId: string): ng.IPromise<number> {
            return this.httpApi.postUriEncoded("/api/likes/like", { songId: songId });
        }

        setSongAsUnranked(songId: string): ng.IPromise<number> {
            const args = {
                songId
            };
            return this.httpApi.postUriEncoded("/api/likes/setAsUnranked", args);
        }
    }

    App.service("likeApi", LikeApiService);
}
