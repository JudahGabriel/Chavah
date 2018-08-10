declare module server {
	interface userProfile {
		registrationDate: Date;
		totalPlays: number;
		dislikedSongCount: number;
		likedSongCount: number;
		favoriteArtists: any[];
		favoriteAlbums: any[];
		favoriteSongs: string[];
		rank: number;
		emailAddress: string;
	}
}
