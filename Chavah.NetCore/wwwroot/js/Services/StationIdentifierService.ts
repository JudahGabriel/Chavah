namespace BitShuva.Chavah {
    export class StationIdentifierService {

        static $inject = [
            "audioPlayer",
        ];

        lastAnnouncementTime = new Date();

        constructor(private audioPlayer: AudioPlayerService) {
        }

        hasPendingAnnouncement() {
            // We play an announcement on the 00s and 30s.
            // Check if we're within 5 minutes of a 00 or 30, and 
            // check if we haven't played the annoucement in 20+ minutes.
            let currentTime = new Date();
            let currentMinute = currentTime.getMinutes();
            let isOnHalfHour = (currentMinute > 55 || currentMinute < 5) || (currentMinute > 25 && currentMinute < 35);
            // tslint:disable-next-line:max-line-length
            let minutesDifferenceSinceLastAnnouncement = (currentTime.valueOf() - this.lastAnnouncementTime.valueOf()) / 60000;
            let hasBeen15MinutesSinceLastAnnouncement = minutesDifferenceSinceLastAnnouncement >= 15;
            if (hasBeen15MinutesSinceLastAnnouncement && isOnHalfHour) {
                this.lastAnnouncementTime = currentTime;
                return true;
            }

            return false;
        }

        playStationIdAnnouncement() {
            let announcementNumbers = [1, 2, 3, 4, 5, 6];
            // tslint:disable-next-line:max-line-length
            let songRequestName = "StationId" + announcementNumbers[Math.floor(Math.random() * announcementNumbers.length)] + ".mp3";
            let songUrl = "https://bitshuvafiles01.com/chavah/soundEffects/" + songRequestName;
            this.audioPlayer.playNewUri(songUrl);
        }
    }

    App.service("stationIdentifier", StationIdentifierService);
}
