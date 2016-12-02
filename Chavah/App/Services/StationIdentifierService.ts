namespace BitShuva.Chavah {
    export class StationIdentifierService {
        lastAnnouncementTime = new Date();

        static $inject = [
            "audioPlayer"
        ];

        constructor(private audioPlayer: AudioPlayerService) {
        }

        hasPendingAnnouncement() {
            // We play an announcement on the 00s and 30s.
            // Check if we're within 5 minutes of a 00 or 30, and 
            // check if we haven't played the annoucement in 20+ minutes.
            var currentTime = new Date();
            var currentMinute = currentTime.getMinutes();
            var isOnHalfHour = (currentMinute > 55 || currentMinute < 5) || (currentMinute > 25 && currentMinute < 35);
            var minutesDifferenceSinceLastAnnouncement = (currentTime.valueOf() - this.lastAnnouncementTime.valueOf()) / 60000;
            var hasBeen15MinutesSinceLastAnnouncement = minutesDifferenceSinceLastAnnouncement >= 15;
            if (hasBeen15MinutesSinceLastAnnouncement && isOnHalfHour) {
                this.lastAnnouncementTime = currentTime;
                return true;
            }

            return false;
        }

        playStationIdAnnouncement() {
            var announcementNumbers = [1, 2, 3, 4, 5, 6];
            var songRequestName = "StationId" + announcementNumbers[Math.floor(Math.random() * announcementNumbers.length)] + ".mp3";
            var songUrl = "content/soundEffects/" + songRequestName;
            this.audioPlayer.playNewUri(songUrl);
        }
    }

    App.service("stationIdentifier", StationIdentifierService);
}