import GetPendingSongRequestCommand = require("commands/getPendingSongRequestCommand");
import RequestSongCommand = require("commands/requestSongCommand");
import Song = require("models/song");
import SongPlayer = require("services/songPlayer");
import GetSongByIdCommand = require("commands/getSongByIdCommand");

class SongRequestManager {

    private pendingSongRequestIds: string[] = [];
    private hasPlayedRequestAnnouncement = false;

    hasPendingRequest() {
        var hasPendingRequest = this.pendingSongRequestIds.length > 0;
        if (this.pendingSongRequestIds.length === 0) {
            this.fetchPendingSongRequests();
        }

        return hasPendingRequest;
    }

    requestSong(song: Song) {
        new RequestSongCommand(song.id).execute();
        this.pendingSongRequestIds.unshift(song.id);
        this.hasPlayedRequestAnnouncement = false;
    }

    playRequest(player: SongPlayer) {
        if (!this.hasPendingRequest()) {
            throw "There was no pending song request.";
        }

        if (!this.hasPlayedRequestAnnouncement) {
            this.hasPlayedRequestAnnouncement = true;
            var songRequestNumbers = [0, 1, 3, 4, 5, 6, 7];
            var songRequestName = "SongRequest" + songRequestNumbers[Math.floor(Math.random() * songRequestNumbers.length)] + ".mp3";
            var songRequestUrl = "content/soundEffects/" + songRequestName;
            player.playNewUri(songRequestUrl);
        }
        else {
            this.hasPlayedRequestAnnouncement = false;
            var pendingRequestedSongId = this.pendingSongRequestIds.splice(0, 1)[0];
            var currentSong = player.song();
            new GetSongByIdCommand(pendingRequestedSongId)
                .execute()
                .done((song: Song) => {
                    var isStillWaitingForSong = player.song() === currentSong;
                    if (isStillWaitingForSong) {
                        player.playNewSong(song);
                    }
                });
        }
    }

    removePendingSongRequest(songId: string) {
        this.pendingSongRequestIds = this.pendingSongRequestIds.filter(id => id !== songId);
    }

    private fetchPendingSongRequests() {
        new GetPendingSongRequestCommand()
            .execute()
            .done((songIdOrNull: string) => {
                if (songIdOrNull && this.pendingSongRequestIds.indexOf(songIdOrNull) === -1) {
                    this.pendingSongRequestIds.push(songIdOrNull);
                }
            });
    }
}

export = SongRequestManager;