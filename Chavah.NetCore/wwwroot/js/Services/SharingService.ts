namespace BitShuva.Chavah {
    export class SharingService {

        static $inject = [
            "homeViewModel"
        ];

        constructor(private homeViewModel: Server.HomeViewModel) {
        }

        shareUrl(id: string): string {
            return `${this.homeViewModel.defaultUrl}/?song=${id}`;
        }

        getEmbedCode(id: string): string {
            // tslint:disable-next-line:max-line-length
            return `<iframe style="border-top: medium none; height: 558px; border-right: medium none; width: 350px; border-bottom: medium none; border-left: medium none" src="${this.homeViewModel.defaultUrl}/home/embed?song=${id}" scrolling="none"></iframe>`;
        }

        facebookShareUrl(song: Song): string {
            const songName = this.getSongName(song);
            // Yes, replace ampersand. Even though we escape it via encodeURIComponent, Facebook barfs on it.
            const name = `${songName} by ${song.artist}`.replace(new RegExp("&", "g"), "and");
            const url = `${this.homeViewModel.defaultUrl}/?song=${song.id}`;

            // We can't link to the song.albumArt, because it comes from a different domain (our CDN), which Facebook doesn't like.
            // Instead, link to a URL on our domain that redirects to the album art on the CDN.
            const albumArtUrl = `${this.homeViewModel.defaultUrl}/api/albums/getAlbumArtBySongId?songId=${song.id}`;
            return "https://www.facebook.com/dialog/feed?app_id=256833604430846" +
                `&link=${url}` +
                `&picture=${encodeURIComponent(albumArtUrl)}` +
                `&name=${encodeURIComponent(name)}` +
                `&description=${encodeURIComponent("On " + song.album)}` +
                // tslint:disable-next-line:max-line-length
                `&caption=${encodeURIComponent("Courtesy of Chavah Messianic Radio - The very best Messianic Jewish and Hebrew Roots music")}` +
                `&redirect_uri=${encodeURIComponent(`${this.homeViewModel.defaultUrl}/#/sharethanks`)}`;
        }

        twitterShareUrl(song: Song): string {
            const songName = this.getSongName(song);
            const tweetText = `Listening to ${songName} by ${song.artist}`;
            const url = `${this.homeViewModel.defaultUrl}/?song=${song.id}`;
            const via = "messianicradio";
            return "https://twitter.com/share" +
                "?text=" + encodeURIComponent(tweetText) +
                "&url=" + encodeURIComponent(url) +
                "&via=" + encodeURIComponent(via);
        }

        smsShareUrl(song: Song): string {
            const songName = this.getSongName(song);
            const url = `${this.homeViewModel.defaultUrl}/?song=${song.id}`;
            const smsMessage = encodeURIComponent(`${songName} by ${song.artist} ${url}`);

            // The actual SMS URL is shaped differently on iOS.
            // https://weblog.west-wind.com/posts/2013/Oct/09/Prefilling-an-SMS-on-Mobile-Devices-with-the-sms-Uri-Scheme
            if (this.isOnIOS()) {
                return `sms:&body=${smsMessage}`;
            }

            return `sms:?body=${smsMessage}`;
        }

        whatsAppShareUrl(song: Song): string {
            const songName = this.getSongName(song);
            const url = `${this.homeViewModel.defaultUrl}/?song=${song.id}`;
            const smsMessage = encodeURIComponent(`${songName} by ${song.artist} ${url}`);
            return `https://wa.me/?text=${smsMessage}`;
        }

        /**
         * Invokes the native share functionality for whichever platform we're on.
         * Currently implements the emerging Web Share API and the Windows Share API.
         * @param song
         */
        nativeShareUrl(song: Song) {
            var nativeShareActions = [
                () => this.tryShareWeb(song),
                () => this.tryShareOnWindows(song)
            ];

            // Invoke each native share action until one succeeds.
            for (let i = 0; i < nativeShareActions.length; i++) {
                var action = nativeShareActions[i];
                var success = action();
                if (success) {
                    break;
                }
            }
        }

        /**
         * Attempts to invoke the native share functionality using the
         * upcoming navigator.share web standard.
         * @see https://developers.google.com/web/updates/2016/09/navigator-share
         * @description As of May 2018, this is only supported in Chrome on Android.
         * @param song The song to share.
         */
        private tryShareWeb(song: Song) {
            // Type definitions for the upcoming web standard.
            type ShareOptions = { title: string; text: string; url: string };
            type NavigatorShare = (options: ShareOptions) => Promise<{}>;
            interface Navigator {
                share?: NavigatorShare;
            }

            const navigatorDotShare = navigator["share"] as NavigatorShare | undefined;
            if (navigatorDotShare) {
                const songName = this.getSongName(song);

                try {
                    navigatorDotShare({
                        title: `${songName} by ${song.artist}`,
                        text: "via Chavah Messianic Radio",
                        url: `${this.homeViewModel.defaultUrl}/?song=${song.id}`
                    });
                    return true;
                } catch (error) {
                    console.log("Unable to trigger navigator.share", error);
                }
            }

            return false;
        }

        private tryShareOnWindows(song: Song): boolean {
            // TODO: this should probably be in a platform-specific file or module.
            if (window["Windows"]) {
                try {
                    const DataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager;
                    const RandomAccessStreamReference = Windows.Storage.Streams.RandomAccessStreamReference;
                    const ShareProvider = Windows.ApplicationModel.DataTransfer["ShareProvider"];
                    const Uri = Windows.Foundation.Uri;

                    const dataTransferManager = DataTransferManager.getForCurrentView();
                    dataTransferManager.addEventListener("datarequested", (ev) => {
                        const data = ev.request.data;
                        var shareData = this.getShareData(song);
                        data.properties.title = shareData.title;
                        data.properties["url"] = shareData.url;
                        data.setText(shareData.text);
                    });

                    dataTransferManager["showShareUI"]();
                    return true;
                }
                catch (error) {
                    console.log("Unable to invoke Windows share functionality.", error);
                }
            }

            return false;
        }

        private getShareData(song: Song): { title: string; text: string; url: string; } {
            return {
                title: `${this.getSongName(song)} by ${song.artist}`,
                text: `via ${this.homeViewModel.pageTitle}`,
                url: `${this.homeViewModel.defaultUrl}/?song=${song.id}`
            }
        }

        private getSongName(song: Song) {
            return [song.hebrewName, song.name]
                .filter(s => !!s)
                .join(" ");
        }

        private isOnIOS(): boolean {
            var ua = navigator.userAgent.toLowerCase();
            return ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1;
        }
    }

    App.service("sharing", SharingService);
}
