var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SharingService = /** @class */ (function () {
            function SharingService(homeViewModel) {
                this.homeViewModel = homeViewModel;
            }
            SharingService.prototype.shareUrl = function (id) {
                return this.homeViewModel.defaultUrl + "/?song=" + id;
            };
            SharingService.prototype.getEmbedCode = function (id) {
                // tslint:disable-next-line:max-line-length
                return "<iframe loading=\"lazy\" style=\"border-top: medium none; height: 558px; border-right: medium none; width: 350px; border-bottom: medium none; border-left: medium none\" src=\"" + this.homeViewModel.defaultUrl + "/home/embed?song=" + id + "\" scrolling=\"none\"></iframe>";
            };
            SharingService.prototype.facebookShareUrl = function (song) {
                var songName = this.getSongName(song);
                // Yes, replace ampersand. Even though we escape it via encodeURIComponent, Facebook barfs on it.
                var name = (songName + " by " + song.artist).replace(new RegExp("&", "g"), "and");
                var url = this.homeViewModel.defaultUrl + "/?song=" + song.id;
                // We can't link to the song.albumArt, because it comes from a different domain (our CDN), which Facebook doesn't like.
                // Instead, link to a URL on our domain that redirects to the album art on the CDN.
                var albumArtUrl = this.homeViewModel.defaultUrl + "/api/albums/getAlbumArtBySongId?songId=" + song.id;
                return "https://www.facebook.com/dialog/feed?app_id=256833604430846" +
                    ("&link=" + url) +
                    ("&picture=" + encodeURIComponent(albumArtUrl)) +
                    ("&name=" + encodeURIComponent(name)) +
                    ("&description=" + encodeURIComponent("On " + song.album)) +
                    (
                    // tslint:disable-next-line:max-line-length
                    "&caption=" + encodeURIComponent("Courtesy of Chavah Messianic Radio - The very best Messianic Jewish and Hebrew Roots music")) +
                    ("&redirect_uri=" + encodeURIComponent(this.homeViewModel.defaultUrl + "/#/sharethanks"));
            };
            SharingService.prototype.twitterShareUrl = function (song) {
                var songName = this.getSongName(song);
                var tweetText = "Listening to " + songName + " by " + song.artist;
                var url = this.homeViewModel.defaultUrl + "/?song=" + song.id;
                var via = "messianicradio";
                return "https://twitter.com/share" +
                    "?text=" + encodeURIComponent(tweetText) +
                    "&url=" + encodeURIComponent(url) +
                    "&via=" + encodeURIComponent(via);
            };
            SharingService.prototype.smsShareUrl = function (song) {
                var songName = this.getSongName(song);
                var url = this.homeViewModel.defaultUrl + "/?song=" + song.id;
                var smsMessage = encodeURIComponent(songName + " by " + song.artist + " " + url);
                // The actual SMS URL is shaped differently on iOS.
                // https://weblog.west-wind.com/posts/2013/Oct/09/Prefilling-an-SMS-on-Mobile-Devices-with-the-sms-Uri-Scheme
                if (this.isOnIOS()) {
                    return "sms:&body=" + smsMessage;
                }
                return "sms:?body=" + smsMessage;
            };
            SharingService.prototype.whatsAppShareUrl = function (song) {
                var songName = this.getSongName(song);
                var url = this.homeViewModel.defaultUrl + "/?song=" + song.id;
                var smsMessage = encodeURIComponent(songName + " by " + song.artist + " " + url);
                return "https://wa.me/?text=" + smsMessage;
            };
            Object.defineProperty(SharingService.prototype, "canNativeShare", {
                get: function () {
                    return !!navigator["share"];
                },
                enumerable: false,
                configurable: true
            });
            /**
             * Invokes the native share functionality for whichever platform we're on.
             * Currently implements the emerging Web Share API and the Windows Share API.
             * @param song
             */
            SharingService.prototype.nativeShare = function (song) {
                if (navigator["share"]) {
                    this.tryShareWeb(song);
                }
            };
            /**
             * Attempts to invoke the native share functionality using the
             * upcoming navigator.share web standard.
             * @see https://developers.google.com/web/updates/2016/09/navigator-share
             * @description As of May 2018, this is only supported in Chrome on Android.
             * @param song The song to share.
             */
            SharingService.prototype.tryShareWeb = function (song) {
                if (navigator["share"]) {
                    var songName = this.getSongName(song);
                    try {
                        navigator["share"]({
                            title: songName + " by " + song.artist,
                            text: "on Chavah Messianic Radio",
                            url: this.homeViewModel.defaultUrl + "/?song=" + song.id
                        }).catch(function (error) { return console.log("Native shared failed", error); });
                    }
                    catch (error) {
                        console.log("Unable to trigger navigator.share", error);
                    }
                }
            };
            SharingService.prototype.getShareData = function (song) {
                return {
                    title: this.getSongName(song) + " by " + song.artist,
                    text: "via " + this.homeViewModel.pageTitle,
                    url: this.homeViewModel.defaultUrl + "/?song=" + song.id
                };
            };
            SharingService.prototype.getSongName = function (song) {
                return [song.hebrewName, song.name]
                    .filter(function (s) { return !!s; })
                    .join(" ");
            };
            SharingService.prototype.isOnIOS = function () {
                var ua = navigator.userAgent.toLowerCase();
                return ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1;
            };
            SharingService.$inject = [
                "homeViewModel"
            ];
            return SharingService;
        }());
        Chavah.SharingService = SharingService;
        Chavah.App.service("sharing", SharingService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SharingService.js.map