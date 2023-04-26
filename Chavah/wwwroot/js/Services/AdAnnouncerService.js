var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AdAnnouncerService = /** @class */ (function () {
            function AdAnnouncerService(audioPlayer, homeViewModel) {
                this.audioPlayer = audioPlayer;
                this.homeViewModel = homeViewModel;
                this.lastAnnouncementTime = new Date();
            }
            AdAnnouncerService.prototype.hasPendingAnnouncement = function () {
                // We play an announcement on the 45 minute mark.
                // Check if we're within that time and that we haven't played the annoucement in 20+ minutes.
                var currentTime = new Date();
                var currentMinute = currentTime.getMinutes();
                var currentHour = currentTime.getHours();
                var isNearMinute = currentMinute >= 42 && currentMinute <= 47;
                // tslint:disable-next-line:max-line-length
                var minutesDifferenceSinceLastAnnouncement = (currentTime.valueOf() - this.lastAnnouncementTime.valueOf()) / 60000;
                var hasBeen20MinutesSinceLastAnnouncement = minutesDifferenceSinceLastAnnouncement >= 20;
                if (hasBeen20MinutesSinceLastAnnouncement && isNearMinute) {
                    this.lastAnnouncementTime = currentTime;
                    return true;
                }
                return false;
            };
            AdAnnouncerService.prototype.playAdAnnouncement = function () {
                var announcementNumbers = [1, 2, 3, 4, 5];
                var fileName = "ad" + announcementNumbers[Math.floor(Math.random() * announcementNumbers.length)] + "x.mp3";
                var songUrl = this.homeViewModel.soundEffects + "/" + fileName;
                this.audioPlayer.playNewUri(songUrl);
            };
            AdAnnouncerService.$inject = [
                "audioPlayer",
                "homeViewModel"
            ];
            return AdAnnouncerService;
        }());
        Chavah.AdAnnouncerService = AdAnnouncerService;
        Chavah.App.service("adAnnouncer", AdAnnouncerService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AdAnnouncerService.js.map