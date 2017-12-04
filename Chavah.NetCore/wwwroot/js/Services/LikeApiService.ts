namespace BitShuva.Chavah {
    export class LikeApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        dislikeSong(songId: string): ng.IPromise<number> {
            let args = {
                songId,
            };
            return this.httpApi.postUriEncoded("/api/likes/dislike", args);
        }

        likeSong(songId: string): ng.IPromise<number> {
            let args = {
                songId,
            };
            return this.httpApi.postUriEncoded("/api/likes/like", args);
        }
    }

    App.service("likeApi", LikeApiService);
}
