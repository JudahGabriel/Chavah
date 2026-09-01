import { httpApi } from "./http-api-service";

/** Like/dislike API calls. Ported from the AngularJS `LikeApiService`. */
export class LikeApiService {
  dislikeSong(songId: string): Promise<number> {
    return httpApi.postUriEncoded("/api/likes/dislike", { songId });
  }

  likeSong(songId: string): Promise<number> {
    return httpApi.postUriEncoded("/api/likes/like", { songId });
  }

  setSongAsUnranked(songId: string): Promise<number> {
    const args = { songId };
    return httpApi.postUriEncoded("/api/likes/setAsUnranked", args);
  }
}

export const likeApi = new LikeApiService();
