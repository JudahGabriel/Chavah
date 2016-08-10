import LikeDislikeSongCommand = require("commands/likeDislikeSongCommand");
import GetUpDownVotesCommand = require("commands/getUpDownVotesCommand");

class Song {

    static unranked: number = 0;
    static liked: number = 1;
    static disliked: number = 2;

    name: string;
    album: string;
    artist: string;
    artistImages: string[];
    albumArtUri: string;
    albumSongNumber: number;
    uri: string;
    likeStatus: KnockoutObservable<number>;
    communityRank: KnockoutObservable<number>;
    communityRankStanding: number;
    id: string;
    isLiked: KnockoutComputed<boolean>;
    isDisliked: KnockoutComputed<boolean>;
    thumbUpImage: KnockoutComputed<string>;
    thumbDownImage: KnockoutComputed<string>;
    communityRankColor: KnockoutComputed<string>;
    likeHoverText: KnockoutComputed<string>;
    dislikeHoverText: KnockoutComputed<string>;
    lyrics: string;
    genres: string[];
    genresCsv: KnockoutComputed<string>;
    albumArtOrArtistImage = ko.observable<string>();
    isCumulativeRank = ko.observable(true);
    totalPlays: number;
    totalUpVotes = ko.observable<number>();
    totalDownVotes = ko.observable<number>();
    colorClass: KnockoutComputed<string>;
    totalUpVoteText: KnockoutComputed<string>;
    totalDownVoteText: KnockoutComputed<string>;
    artistInfo = ko.observable<ArtistDto>();
    tags: string[];
    tagsCsv: KnockoutComputed<string>;
    purchaseUri: string;

    constructor(dto: SongDto) {
        this.name = dto.Name;
        this.albumSongNumber = dto.Number;
        this.album = dto.Album;
        this.artist = dto.Artist;
        this.albumArtUri = dto.AlbumArtUri;
        this.uri = dto.Uri;
        this.likeStatus = ko.observable(dto.SongLike);
        this.communityRank = ko.observable(dto.CommunityRank);
        this.communityRankStanding = dto.CommunityRankStanding;
        this.id = dto.Id;
        this.lyrics = dto.Lyrics;
        this.genres = dto.Genres;
        this.artistImages = dto.ArtistImages;
        this.albumArtOrArtistImage(dto.AlbumArtUri);
        this.totalPlays = dto.TotalPlays;
        this.tags = dto.Tags;

        this.isLiked = ko.computed(() => this.likeStatus() === Song.liked);
        this.isDisliked = ko.computed(() => this.likeStatus() === Song.disliked);
        this.thumbUpImage = ko.computed(() => "/content/images/up" + (this.isLiked() ? "Checked.png" : ".png"));
        this.thumbDownImage = ko.computed(() => "/content/images/down" + (this.isDisliked() ? "Checked.png" : ".png"));
        this.likeHoverText = ko.computed(() => this.likeStatus() === Song.liked ? "You've already liked this song. We'll keep playing more songs like it" : "I like this song, play more songs like it");
        this.dislikeHoverText = ko.computed(() => this.likeStatus() === Song.disliked ? "You already disliked this song. We'll keep it on the back shelf, and rarely play it for you" : "I don't like this song, don't play it again");
        this.colorClass = ko.computed(() => this.getColorClass());
        this.totalUpVoteText = ko.computed(() => this.totalUpVotes() ? '+' + this.totalUpVotes() : null);
        this.totalDownVoteText = ko.computed(() => this.totalDownVotes() ? '-' + this.totalDownVotes() : null);
        this.purchaseUri = dto.PurchaseUri ? dto.PurchaseUri : 'http://lmgtfy.com/?q=' + encodeURIComponent(this.artist + " " + this.album + " purchase");
        this.tagsCsv = ko.computed<string>({
            read: () => this.tags.join(", "),
            write: (val: string) => this.tags = val.split(",").map(v => v.trim())
        });
        this.genresCsv = ko.computed<string>({
            read: () => this.genres.join(", "),
            write: (val: string) => this.genres = val.split(",").map(v => v.trim())
        });
    }
    
    dislike() {
        if (!this.isDisliked()) {
            var incrementAmount = this.isLiked() ? -2 : -1;
            this.likeOrDislike(incrementAmount, "Dislike");
            ko.postbox.publish("NextSong");

            if (this.totalDownVotes() != null) {
                this.totalDownVotes(this.totalDownVotes() + incrementAmount);
            }
        }
    }

    like() {
        if (!this.isLiked()) {
            var incrementAmount = this.isDisliked() ? 2 : 1;
            this.likeOrDislike(incrementAmount, "Like");

            if (this.totalUpVotes() != null) {
                this.totalUpVotes(this.totalUpVotes() + incrementAmount);
            }
        }
    }

    likeOrDislike(increment, actionName) {
        this.communityRank(this.communityRank() + increment);
        this.likeStatus(increment > 0 ? Song.liked : Song.disliked);

        new LikeDislikeSongCommand(this.id, increment > 0)
            .execute()
            .done((rating: number) => this.communityRank(rating));
    }

    showIndividualRank() {
        this.isCumulativeRank(false);
        this.fetchIndividualRanks();
    }

    fetchIndividualRanks() {
        new GetUpDownVotesCommand(this.id)
            .execute()
            .done((result: UpDownVotesDto) => {
                this.totalUpVotes(result.UpVotes);
                this.totalDownVotes(result.DownVotes);
            });
    }

    private getColorClass() {
        var rank = this.communityRank();
        var styleNumber =
            rank <= -10 ? 0 :
            rank <= -2 ? 1 :
            rank <= 20 ? 2 :
            rank <= 40 ? 3 :
            rank <= 80 ? 4 :
            rank <= 100 ? 5 :
            rank <= 120 ? 6 :
            rank <= 150 ? 7 :
            rank <= 200 ? 8 :
            rank <= 250 ? 9 :
            rank <= 300 ? 10 :
            rank <= 350 ? 11 :
            rank <= 400 ? 12 :
            rank <= 450 ? 13 :
            rank <= 500 ? 14 :
            rank <= 600 ? 15 :
            rank <= 700 ? 16 :
            17;
        return "song-rank-" + styleNumber;
    }

    toDto(): SongDto {
        return {
            Album: this.album,
            AlbumArtUri: this.albumArtUri,
            Artist: this.artist,
            ArtistImages: this.artistImages,
            CommunityRank: this.communityRank(),
            CommunityRankStanding: this.communityRankStanding,
            Genres: this.genres,
            Id: this.id,
            Lyrics: this.lyrics,
            Name: this.name,
            Number: this.albumSongNumber,
            PurchaseUri: this.purchaseUri,
            SongLike: this.likeStatus(),
            Tags: this.tags,
            TotalPlays: this.totalPlays,
            Uri: this.uri
        };
    }

    updateFrom(other: Song) {
        this.album = other.album;
        this.albumArtUri = other.albumArtUri;
        this.albumSongNumber = other.albumSongNumber;
        this.artist = other.artist;
        this.artistImages = [].concat(other.artistImages);
        this.artistInfo(other.artistInfo());
        this.communityRank(other.communityRank());
        this.communityRankStanding = other.communityRankStanding;
        this.genres = [].concat(other.genres);
        this.tags = [].concat(other.tags);
        this.id = other.id;
        this.likeStatus(other.likeStatus());
        this.lyrics = other.lyrics;
        this.name = other.name;
        this.totalPlays = other.totalPlays;
        this.purchaseUri = other.purchaseUri;
        this.uri = other.uri;
    }

    private getCommunityRankTitle() {
        var standing = this.communityRankStanding;
        var rank = this.communityRank();
        var standingText =
            standing === 0 ? "Average" :
            standing === 1 ? "Very Poor" :
            standing === 2 ? "Poor" :
            standing === 3 ? "Good" :
            standing === 4 ? "Great" :
            "Best";
        return standingText;
    }

    private getNthSongText(): string {
        var value = 
            this.albumSongNumber === 0 ? "1st" :
            this.albumSongNumber === 1 ? "1st" :
            this.albumSongNumber === 2 ? "2nd" :
            this.albumSongNumber === 3 ? "3rd" :
            this.albumSongNumber >= 4 && this.albumSongNumber <= 19 ? this.albumSongNumber + "th" :
            "#" + this.albumSongNumber;
        return value;
    }
} 

export = Song;