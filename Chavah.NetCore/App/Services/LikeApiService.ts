namespace BitShuva.Chavah {
    export class LikeApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        dislikeSong(songId: string): ng.IPromise<number> {
            return this.httpApi.post(`/api/likes/dislike?songId=${songId}`, null);
        }

        likeSong(songId: string): ng.IPromise<number> {
            return this.httpApi.post(`/api/likes/like?songId=${songId}`, null);
        }
    }

    App.service("likeApi", LikeApiService);
}