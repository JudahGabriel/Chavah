namespace BitShuva.Chavah {

    export interface NewMusicAnnoucement {
        songId: string;
        announcementPlayed: boolean;
    }

    export class NewMusicAnnouncerService {

        static $inject = [
            "audioPlayer",
            "songApi",
            "homeViewModel"
        ];

        private lastNewMusicAnnouncement = new Date();
        private pendingNewMusicAnnouncement: NewMusicAnnoucement | null = null;

        constructor(
            private readonly audioPlayer: AudioPlayerService,
            private readonly songApi: SongApiService,
            private readonly homeViewModel: Server.HomeViewModel) {

            // Move the last new music announcement to yesterday.
            // That way we'll get a new music announcement on our desired timeframe, even if we just started listening.
            this.lastNewMusicAnnouncement.setDate(this.lastNewMusicAnnouncement.getDate() - 1); 
        }

        getPendingNewMusicAnnouncement(): NewMusicAnnoucement | null {
            // We play new music announcement on the 15 minute mark.
            // Check if we're within that time and that we haven't played the annoucement in 10+ minutes.
            const currentTime = new Date();
            const currentMinute = currentTime.getMinutes();
            const isNearMinute = currentMinute >= 13 && currentMinute <= 17;
            // tslint:disable-next-line:max-line-length
            const minutesDifferenceSinceLastAnnouncement = (currentTime.valueOf() - this.lastNewMusicAnnouncement.valueOf()) / 60000;
            const hasBeen10MinutesSinceLastAnnouncement = minutesDifferenceSinceLastAnnouncement >= 10;
            if (hasBeen10MinutesSinceLastAnnouncement && isNearMinute && this.pendingNewMusicAnnouncement) {
                return this.pendingNewMusicAnnouncement;
            }

            // No pending announcement. But check if we have some new music to play for next time we're asked.
            if (!this.pendingNewMusicAnnouncement) {
                this.fetchNewMusicSongId();
            }

            return null;
        }

        play(announcement: NewMusicAnnoucement) {
            if (!announcement.announcementPlayed) {
                // First play the announcement, "next up is new music..."
                const newMusicAnnouncementCount = 6;
                announcement.announcementPlayed = true;
                const randomNewMusicNumber = randomNumber(1, newMusicAnnouncementCount);
                const newMusicUrl = `${this.homeViewModel.soundEffects}/new-music-${randomNewMusicNumber}x.mp3`;
                this.audioPlayer.playNewUri(newMusicUrl);
            } else {
                // Then play the actual new song and reset our state.
                this.audioPlayer.playSongById(announcement.songId);
                this.pendingNewMusicAnnouncement = null;
                this.lastNewMusicAnnouncement = new Date();
            }
        }

        private fetchNewMusicSongId() {
            this.songApi.getRandomNewSongForUser()
                .then(newSongId => this.newSongForUserLoaded(newSongId));
        }

        private newSongForUserLoaded(newSongId: string | null) {
            if (newSongId && !this.pendingNewMusicAnnouncement) {
                this.pendingNewMusicAnnouncement = {
                    songId: newSongId,
                    announcementPlayed: false
                };
            }
        }
    }

    App.service("newMusicAnnouncer", NewMusicAnnouncerService);
}
