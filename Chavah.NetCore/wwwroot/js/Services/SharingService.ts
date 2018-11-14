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

        /**
         * Attempts to invoke the native share functionality using the
         * upcoming navigator.share web standard.
         * @see https://developers.google.com/web/updates/2016/09/navigator-share
         * @description As of May 2018, this is only supported in Chrome on Android.
         * @param song The song to share.
         */
        nativeShareUrl(song: Song) {
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
                } catch (error) {
                    console.log("Unable to trigger navigator.share", error);
                }
            }
        }

        private getSongName(song: Song) {
            return [song.hebrewName, song.name]
                .filter(s => !!s)
                .join(" ");
        }
    }

    App.service("sharing", SharingService);
}
