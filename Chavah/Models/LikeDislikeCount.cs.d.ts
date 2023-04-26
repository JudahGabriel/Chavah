declare module server {
	interface likeDislikeCount {
		/** The name of the artist, album, or other category. */
		name: string;
		/** The number of likes for the name. */
		likeCount: number;
		/** The number of dislikes for the name. */
		dislikeCount: number;
		/** The ID of the song this like/dislike applies to. */
		songId: string;
	}
}
