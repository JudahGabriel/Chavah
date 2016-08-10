module BitShuva.Chavah.Server {
    export interface ISong {
        Name: string;
        Number: number;
        Album: string;
        Artist: string;
        CommunityRank: number;
        CommunityRankStanding: number;
        Id: string;
        AlbumArtUri: string;
        TotalPlays: number;
        Uri: string;
        SongLike: number;
        Lyrics: string;
        Genres: string[];
        Tags: string[];
        ArtistImages: string[];
        PurchaseUri: string;
    }

    export interface IUpDownVotes {
        UpVotes: number;
        DownVotes: number;
        SongId: string;
    }

    export interface IArtist {
        Name: string;
        Images: string[];
        Bio: string;
    }

    export interface IPagedList<T> {
        Items: T[];
        Total: number;
        Skip: number;
        Take: number;
    }

    export interface ISongUpload {
        Address: string;
        FileName: string;
    }

    export interface IAlbumUpload {
        Name: string,
        Artist: string,
        AlbumArtUri: string,
        Songs: Server.ISongUpload[],
        PurchaseUrl: string,
        Genres: string,
        ForeColor: string,
        BackColor: string,
        MutedColor: string,
        TextShadowColor: string
    }
}