/// <reference path="LikeDislikeCount.cs.d.ts" />

declare module server {
	interface UserProfile {
		RegistrationDate: Date;
		TotalPlays: number;
		DislikedSongCount: number;
		LikedSongCount: number;
		FavoriteArtists: server.LikeDislikeCount[];
		FavoriteAlbums: server.LikeDislikeCount[];
		FavoriteSongs: string[];
		Rank: number;
		EmailAddress: string;
	}
}
