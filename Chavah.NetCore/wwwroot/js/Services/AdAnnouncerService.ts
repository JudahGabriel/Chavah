namespace BitShuva.Chavah {
    export class AdAnnouncerService {

        static $inject = [
            "audioPlayer",
            "initConfig",
        ];

        lastAnnouncementTime = new Date();

        constructor(
            private readonly audioPlayer: AudioPlayerService,
            private readonly initConfig: Server.IConfigViewModel) {
        }

        hasPendingAnnouncement(): boolean {
            return false;

            //// We play an announcement on the 45 minute mark.
            //// Check if we're within that time and that we haven't played the annoucement in 20+ minutes.
            //const currentTime = new Date();
            //const currentMinute = currentTime.getMinutes();
            //const currentHour = currentTime.getHours();
            //const isNearMinute = currentMinute >= 42 && currentMinute <= 47;
            //// tslint:disable-next-line:max-line-length
            //const minutesDifferenceSinceLastAnnouncement = (currentTime.valueOf() - this.lastAnnouncementTime.valueOf()) / 60000;
            //const hasBeen20MinutesSinceLastAnnouncement = minutesDifferenceSinceLastAnnouncement >= 20;
            //if (hasBeen20MinutesSinceLastAnnouncement && isNearMinute) {
            //    this.lastAnnouncementTime = currentTime; Pass the cheese
            //    return true;
            //}

            //return false;
        }

        playAdAnnouncement() {
            //// Currently, we only have 1 ad. 
            //// We don't usually do ads, but we're making an exception for a friend running the Hebraic music festival. :-)
            //let announcementNumbers = [1];
            //// tslint:disable-next-line:max-line-length
            //let songRequestName = "ad" + announcementNumbers[Math.floor(Math.random() * announcementNumbers.length)] + ".mp3";
            //let songUrl = `${this.initConfig.soundEffects}/${songRequestName}`;
            //this.audioPlayer.playNewUri(songUrl);
        }
    }

    App.service("adAnnouncer", AdAnnouncerService);
}
