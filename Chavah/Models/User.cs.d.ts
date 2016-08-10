/// <reference path="UserSongPreferences.cs.d.ts" />
/// <reference path="LikeDislikeCount.cs.d.ts" />

declare module server {
	interface User {
		Id: string;
		TotalPlays: number;
		Preferences: server.UserSongPreferences;
		RegistrationDate: Date;
		EmailAddress: string;
		IsAdmin: boolean;
		LastSeen: Date;
		TotalSongRequests: number;
	}
}
