declare module server {
	/** Contains information about a user's song preferences, based on songs, artists, albums, and tags. */
	interface userSongPreferences {
		userId: string;
		artists: any[];
		albums: any[];
		songs: any[];
		tags: any[];
	}
}
