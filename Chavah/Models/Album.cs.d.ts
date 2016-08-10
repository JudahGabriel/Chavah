declare module server {
	/** An album for which album art has been uploaded. */
	interface Album {
		Artist: string;
		Name: string;
		AlbumArtUri: {
			AbsolutePath: string;
			AbsoluteUri: string;
			Authority: string;
			DnsSafeHost: string;
			Fragment: string;
			Host: string;
			HostNameType: any;
			IsAbsoluteUri: boolean;
			IsDefaultPort: boolean;
			IsFile: boolean;
			IsLoopback: boolean;
			IsUnc: boolean;
			LocalPath: string;
			OriginalString: string;
			PathAndQuery: string;
			Port: number;
			Query: string;
			Scheme: string;
			Segments: string[];
			UserEscaped: boolean;
			UserInfo: string;
		};
		Id: string;
	}
}
