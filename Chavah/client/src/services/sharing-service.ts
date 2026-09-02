import { getHomeViewModel, type HomeViewModel } from "../shared/home-view-model";
import type { Song } from "../models/song";

type ShareCapableNavigator = Navigator & {
  share?: (data: { title: string; text: string; url: string }) => Promise<void>;
};

/**
 * Builds share URLs (Facebook, Twitter, SMS, WhatsApp, embed) and invokes the
 * native Web Share API. Ported from the AngularJS `SharingService`; the injected
 * `homeViewModel` is now read via `getHomeViewModel()`.
 */
export class SharingService {
  private readonly homeViewModel: HomeViewModel = getHomeViewModel();

  shareUrl(id: string): string {
    return `${this.homeViewModel.defaultUrl}/?song=${id}`;
  }

  getEmbedCode(id: string): string {
    return `<iframe loading="lazy" style="border-top: medium none; height: 558px; border-right: medium none; width: 350px; border-bottom: medium none; border-left: medium none" src="${this.homeViewModel.defaultUrl}/home/embed?song=${id}" scrolling="none"></iframe>`;
  }

  facebookShareUrl(song: Song): string {
    const songName = this.getSongName(song);
    // Yes, replace ampersand. Even though we escape it via encodeURIComponent, Facebook barfs on it.
    const name = `${songName} by ${song.artist}`.replace(new RegExp("&", "g"), "and");
    const url = `${this.homeViewModel.defaultUrl}/?song=${song.id}`;

    // We can't link to song.albumArt because it comes from a different domain (our CDN), which Facebook
    // doesn't like. Instead, link to a URL on our domain that redirects to the album art on the CDN.
    const albumArtUrl = `${this.homeViewModel.defaultUrl}/api/albums/getAlbumArtBySongId?songId=${song.id}`;
    return (
      "https://www.facebook.com/dialog/feed?app_id=256833604430846" +
      `&link=${url}` +
      `&picture=${encodeURIComponent(albumArtUrl)}` +
      `&name=${encodeURIComponent(name)}` +
      `&description=${encodeURIComponent("On " + song.album)}` +
      `&caption=${encodeURIComponent(
        "Courtesy of Chavah Messianic Radio - The very best Messianic Jewish and Hebrew Roots music",
      )}` +
      `&redirect_uri=${encodeURIComponent(`${this.homeViewModel.defaultUrl}/#/sharethanks`)}`
    );
  }

  twitterShareUrl(song: Song): string {
    const songName = this.getSongName(song);
    const tweetText = `Listening to ${songName} by ${song.artist}`;
    const url = `${this.homeViewModel.defaultUrl}/?song=${song.id}`;
    const via = "messianicradio";
    return (
      "https://twitter.com/share" +
      "?text=" +
      encodeURIComponent(tweetText) +
      "&url=" +
      encodeURIComponent(url) +
      "&via=" +
      encodeURIComponent(via)
    );
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

  get canNativeShare(): boolean {
    return !!(navigator as ShareCapableNavigator).share;
  }

  /**
   * Invokes the native share functionality (Web Share API) for the platform
   * we're on, when available.
   */
  nativeShare(song: Song): void {
    if ((navigator as ShareCapableNavigator).share) {
      this.tryShareWeb(song);
    }
  }

  private tryShareWeb(song: Song): void {
    const shareNavigator = navigator as ShareCapableNavigator;
    if (shareNavigator.share) {
      const songName = this.getSongName(song);
      try {
        shareNavigator
          .share({
            title: `${songName} by ${song.artist}`,
            text: "on Chavah Messianic Radio",
            url: `${this.homeViewModel.defaultUrl}/?song=${song.id}`,
          })
          .catch((error) => console.log("Native share failed", error));
      } catch (error) {
        console.log("Unable to trigger navigator.share", error);
      }
    }
  }

  private getSongName(song: Song): string {
    return [song.hebrewName, song.name].filter((s) => !!s).join(" ");
  }

  private isOnIOS(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1;
  }
}

export const sharing = new SharingService();
