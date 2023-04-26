var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var StationIdentifierService = /** @class */ (function () {
            function StationIdentifierService(audioPlayer) {
                this.audioPlayer = audioPlayer;
                this.lastAnnouncementTime = new Date();
            }
            StationIdentifierService.prototype.hasPendingAnnouncement = function () {
                // We play an announcement on the 00s and 30s.
                // Check if we're within 5 minutes of a 00 or 30, and 
                // check if we haven't played the annoucement in 20+ minutes.
                var currentTime = new Date();
                var currentMinute = currentTime.getMinutes();
                var isOnHalfHour = (currentMinute > 55 || currentMinute < 5) || (currentMinute > 25 && currentMinute < 35);
                // tslint:disable-next-line:max-line-length
                var minutesDifferenceSinceLastAnnouncement = (currentTime.valueOf() - this.lastAnnouncementTime.valueOf()) / 60000;
                var hasBeen15MinutesSinceLastAnnouncement = minutesDifferenceSinceLastAnnouncement >= 15;
                if (hasBeen15MinutesSinceLastAnnouncement && isOnHalfHour) {
                    this.lastAnnouncementTime = currentTime;
                    return true;
                }
                return false;
            };
            StationIdentifierService.prototype.playStationIdAnnouncement = function () {
                var songUrl = "/api/cdn/getstationid";
                this.audioPlayer.playNewUri(songUrl);
            };
            StationIdentifierService.$inject = [
                "audioPlayer"
            ];
            return StationIdentifierService;
        }());
        Chavah.StationIdentifierService = StationIdentifierService;
        Chavah.App.service("stationIdentifier", StationIdentifierService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=StationIdentifierService.js.map