/// <reference path="LikeDislikeCount.cs.d.ts" />

declare module server {
	interface UserSongPreferences {
		Artists: server.LikeDislikeCount[];
		Albums: server.LikeDislikeCount[];
		Songs: server.LikeDislikeCount[];
	}
}
