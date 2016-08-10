import Song = require("models/song");

class SongPlaceHolder {
    song = ko.observable<Song>();
    hasSong: KnockoutComputed<boolean>;
    albumArtUri: KnockoutComputed<string>;
    communityRank: KnockoutComputed<number>;
    communityRankStanding: KnockoutComputed<number>;
    name: KnockoutComputed<string>;
    artist: KnockoutComputed<string>
    album: KnockoutComputed<string>;
    preventSongSwitch = false;
    enqueuedSong = ko.observable<Song>();
    title: KnockoutComputed<string>;

    constructor() {
        this.hasSong = ko.computed(() => this.song() != null);
        this.albumArtUri = ko.computed(() => this.song() ? this.song().albumArtUri : null);
        this.communityRank = ko.computed(() => this.song() ? this.song().communityRank() : 0);
        this.communityRankStanding = ko.computed(() => this.song() ? this.song().communityRankStanding : 0);
        this.name = ko.computed(() => this.song() ? this.song().name : "");
        this.artist = ko.computed(() => this.song() ? this.song().artist : "");
        this.album = ko.computed(() => this.song() ? this.song().album : "");
        this.title = ko.computed(() => this.name() + "<br /><span class='text-muted'>by </span>" + this.artist() + "<br /><span class='text-muted'>on </span>" + this.album() + "<br /><span class='text-muted'>Rank: </span>" + this.getCommunityRankTitle());
    }

	updateSong(newSong: Song) {
        if ((!this.song() || !newSong || this.song().id !== newSong.id) && !this.preventSongSwitch) {
            this.song(newSong);
        }
    }

    mouseEnter() {
        this.preventSongSwitch = true;
    }

    mouseLeave() {
        this.preventSongSwitch = false;
    }

    private getCommunityRankTitle() {
        var standing = this.communityRankStanding();
        var rank = this.communityRank();
        var standingText =
            standing === 0 ? "Average" :
            standing === 1 ? "Very Poor" :
            standing === 2 ? "Poor" :
            standing === 3 ? "Good" :
            standing === 4 ? "Great" :
            "Best";
        var rankText = rank > 0 ? "+" + rank : rank.toString();
        return rankText + " (" + standingText + ")";
    }
}

export = SongPlaceHolder;