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
            this.lastAnnouncementTime.setDate(this.lastAnnouncementTime.getDate() - 1); // set last announcement time to yesterday.
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
            // Half the time, play the Passover in Jerusalem ad.
            if (randomNumber(1, 2) === 1) {
                const jerusalemAdUrl = `${this.homeViewModel.soundEffects}/ad-passover-jerusalem-2025.mp3`;
                this.audioPlayer.playNewUri(jerusalemAdUrl);
                return;
            }

            const availableAds = 5;
            const randomAdNumber = randomNumber(1, availableAds);
            const adUrl = `${this.homeViewModel.soundEffects}/ad${randomAdNumber}x.mp3`;
            this.audioPlayer.playNewUri(adUrl);
        }
    }

    App.service("adAnnouncer", AdAnnouncerService);
}
