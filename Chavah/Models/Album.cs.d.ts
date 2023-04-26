declare module server {
	/** An album for which album art has been uploaded. */
	interface album {
		artist: string;
		name: string;
		albumArtUri: {
			absolutePath: string;
			absoluteUri: string;
			authority: string;
			dnsSafeHost: string;
			fragment: string;
			host: string;
			hostNameType: any;
			idnHost: string;
			isAbsoluteUri: boolean;
			isDefaultPort: boolean;
			isFile: boolean;
			isLoopback: boolean;
			isUnc: boolean;
			localPath: string;
			originalString: string;
			pathAndQuery: string;
			port: number;
			query: string;
			scheme: string;
			segments: string[];
			userEscaped: boolean;
			userInfo: string;
		};
		id: string;
		backgroundColor: string;
		foregroundColor: string;
		mutedColor: string;
		textShadowColor: string;
		isVariousArtists: boolean;
		songCount: number;
	}
}
