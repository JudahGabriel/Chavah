namespace BitShuva.Chavah {
    export class AdAnnouncerService {

        static $inject = [
            "audioPlayer",
            "homeViewModel"
        ];

        lastAnnouncementTime = new Date();

        constructor(
            private readonly audioPlayer: AudioPlayerService,
            private readonly homeViewModel: Server.HomeViewModel) {
        }

        hasPendingAnnouncement(): boolean {
            // We play an announcement on the 45 minute mark.
            // Check if we're within that time and that we haven't played the annoucement in 20+ minutes.
            const currentTime = new Date();
            const currentMinute = currentTime.getMinutes();
            const currentHour = currentTime.getHours();
            const isNearMinute = currentMinute >= 42 && currentMinute <= 47;
            // tslint:disable-next-line:max-line-length
            const minutesDifferenceSinceLastAnnouncement = (currentTime.valueOf() - this.lastAnnouncementTime.valueOf()) / 60000;
            const hasBeen20MinutesSinceLastAnnouncement = minutesDifferenceSinceLastAnnouncement >= 20;
            if (hasBeen20MinutesSinceLastAnnouncement && isNearMinute) {
                this.lastAnnouncementTime = currentTime;
                return true;
            }

            return false;
        }

        playAdAnnouncement() {
            const announcementNumbers = [1,2,3,4,5];
            const fileName = "ad" + announcementNumbers[Math.floor(Math.random() * announcementNumbers.length)] + "x.mp3";
            const songUrl = `${this.homeViewModel.soundEffects}/${fileName}`;
            this.audioPlayer.playNewUri(songUrl);
        }
    }

    App.service("adAnnouncer", AdAnnouncerService);
}
