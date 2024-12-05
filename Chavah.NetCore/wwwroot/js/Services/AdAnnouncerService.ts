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
            const adUrl = "/api/cdn/getAdAnnouncement";

            // Check if this is a redirect. If so, find the target of the redirect and play that.
            // If not, play the URL.
            // Reason is, on iOS we use native audio to play the URL. It can have issues playing a redirect result.
            window.fetch(adUrl)
                .then(res => {
                    const isRedirect = res.status >= 300 && res.status < 400;
                    if (isRedirect) {
                        const redirectUrl = res.headers.get("Location");
                        this.audioPlayer.playNewUri(redirectUrl || adUrl);
                    }
                }, err => {
                    console.warn("Unable to fetch ad announcement URL due to error", err);
                    this.audioPlayer.playNewUri(adUrl);
                });
        }
    }

    App.service("adAnnouncer", AdAnnouncerService);
}
