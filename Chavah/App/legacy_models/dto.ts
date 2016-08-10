interface SongDto {
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

interface UpDownVotesDto {
    UpVotes: number;
    DownVotes: number;
    SongId: string;
}

interface ArtistDto {
    Name: string;
    Images: string[];
    Bio: string;
}

interface PagedListDto<T> {
    Items: T[];
    Total: number;
    Skip: number;
    Take: number;
}