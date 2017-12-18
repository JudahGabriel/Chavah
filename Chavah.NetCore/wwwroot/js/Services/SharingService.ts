namespace BitShuva.Chavah {
    export class SharingService {

        static $inject = ["initConfig"];

        constructor(private initConfig: Server.IHomeViewModel) {
        }

        shareUrl(id: string): string {

            return `${this.initConfig.defaultUrl}/?song=${id}`;

        }

        getEmbedCode(id: string): string {
            // tslint:disable-next-line:max-line-length
            return `<iframe style="border-top: medium none; height: 558px; border-right: medium none; width: 350px; border-bottom: medium none; border-left: medium none" src="${this.initConfig.defaultUrl}/home/embed?song=${id}" scrolling="none"></iframe>`;
        }

        facebookShareUrl(song: Song): string {
            let result: string                // Yes, replace ampersand. Even though we escape it via encodeURIComponent, Facebook barfs on it.
                let name = `${song.artist} - ${song.name}`.replace(new RegExp("&", "g"), "and");
                let url = `${this.initConfig.defaultUrl}/?song=${song.id}`;
                let albumArtUrl = `${this.initConfig.defaultUrl}/api/albums/getArtforSong?songId=${song.id}`;
                result = "https://www.facebook.com/dialog/feed?app_id=256833604430846" +
                    `&link=${url}` +
                    `&picture=${encodeURIComponent(albumArtUrl)}` +
                    `&name=${encodeURIComponent(name)}` +
                    `&description=${encodeURIComponent("On " + song.album)}` +
                    // tslint:disable-next-line:max-line-length
                    `&caption=${encodeURIComponent("Courtesy of Chavah Messianic Radio - The very best Messianic Jewish and Hebrew Roots music")}` +
                    `&redirect_uri=${encodeURIComponent(`${this.initConfig.defaultUrl}/#/sharethanks`)}`;
            return result;
        }

        twitterShareUrl(song: Song): string {
            let result: string 
                let tweetText = 'Listening to "' + song.artist + " - " + song.name + '"';
                let url = `${this.initConfig.defaultUrl}/?song=${song.id}`;
                let via = "messianicradio";
                result = "https://twitter.com/share" +
                    "?text=" + encodeURIComponent(tweetText) +
                    "&url=" + encodeURIComponent(url) +
                    "&via=" + encodeURIComponent(via);

            return result;
        }

        googlePlusShareUrl(id: string): string {
            let result: string;
                result = "https://plus.google.com/share?url=" + encodeURI(`${this.initConfig.debug}/?song=${id}`);
            return result;
        }
    }

    App.service("sharing", SharingService);
}
