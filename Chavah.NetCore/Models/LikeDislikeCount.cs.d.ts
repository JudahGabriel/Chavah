declare module server {
	interface LikeDislikeCount {
		/** The name of the artist, album, or other category. */
		Name: string;
		/** The number of likes for the name. */
		LikeCount: number;
		/** The number of dislikes for the name. */
		DislikeCount: number;
	}
}
