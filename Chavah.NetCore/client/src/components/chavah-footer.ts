import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { audioPlayer } from "../services/audio-player-service";
import { accountService } from "../services/account-service";
import { appNav } from "../services/app-nav-service";
import { likeApi } from "../services/like-api-service";
import { songBatch } from "../services/song-batch-service";
import { songRequestApi } from "../services/song-request-service";
import { AudioStatus } from "../models/audio-status";
import { SongLike } from "../models/song-like";
import type { Song } from "../models/song";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";

/**
 * The fixed bottom control bar: buffering/trackbar, thumb-down, song request,
 * play/pause, skip, thumb-up, track time, volume, and the Discord link. Hosts
 * the `<audio id="audio">` element that `audioPlayer` binds to. Ported from
 * `views/partials/Footer.html` + `FooterController.ts` + `footer.less`.
 */
@customElement("chavah-footer")
export class ChavahFooter extends LitElement {
  createRenderRoot() {
    return this;
  }

  @state() private status: AudioStatus = AudioStatus.Paused;
  @state() private song: Song | null = null;
  @state() private trackTime = "";
  @state() private trackDuration = "0:00";
  @state() private trackPercent = 0;
  @state() private volume = 1;
  @state() private volumeShown = false;
  @state() private isThumbingUpOrDown = false;

  private subs: Array<() => void> = [];

  connectedCallback(): void {
    super.connectedCallback();
    this.subs = [
      audioPlayer.status.subscribe((s) => (this.status = s)),
      audioPlayer.song.subscribe((s) => (this.song = s)),
      audioPlayer.playedTimeText.subscribe((t) => (this.trackTime = t)),
      audioPlayer.duration.subscribe((d) => (this.trackDuration = this.formatTime(d))),
      audioPlayer.playedTimePercentage.subscribe((p) => (this.trackPercent = p)),
    ];
  }

  disconnectedCallback(): void {
    this.subs.forEach((unsub) => unsub());
    this.subs = [];
    super.disconnectedCallback();
  }

  firstUpdated(): void {
    const audio = this.querySelector("#audio") as HTMLAudioElement | null;
    if (audio) {
      audioPlayer.initialize(audio);
      this.volume = audioPlayer.volume;
    }
  }

  private formatTime(totalSeconds: number): string {
    if (isNaN(totalSeconds) || totalSeconds === 0) {
      return "0:00";
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds - minutes * 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  private get isPaused(): boolean {
    return this.status !== AudioStatus.Playing;
  }

  private get isBuffering(): boolean {
    return this.status === AudioStatus.Buffering || this.status === AudioStatus.Stalled;
  }

  private get likesCurrentSong(): boolean {
    return this.song?.songLike === SongLike.Liked;
  }

  private get dislikesCurrentSong(): boolean {
    return this.song?.songLike === SongLike.Disliked;
  }

  private get likeText(): string {
    return this.likesCurrentSong
      ? "You have already liked this song. Chavah is playing it more often. Tap to undo your like."
      : "Like this song. Chavah will play this song, and others like it, more often.";
  }

  private get dislikeText(): string {
    return this.dislikesCurrentSong
      ? "You have already disliked this song. Chavah is playing it less often. Tap to undo your dislike."
      : "Dislike this song. Chavah will play this song, and others like it, less often.";
  }

  private get volumeIconName(): string {
    if (this.volume > 0.95) return "volume-high";
    if (this.volume < 0.05) return "volume-xmark";
    return "volume-low";
  }

  private ensureSignedIn(): boolean {
    if (accountService.isSignedIn) {
      return true;
    }
    appNav.promptSignIn();
    return false;
  }

  private playPause(): void {
    if (this.status === AudioStatus.Playing) {
      audioPlayer.pause();
    } else {
      audioPlayer.resume();
    }
  }

  private playNextSong(): void {
    audioPlayer.pause();
    if (songRequestApi.hasPendingRequest()) {
      songRequestApi.playRequest();
    } else {
      songBatch.playNext();
    }
  }

  private thumbUpClicked(): void {
    if (!this.ensureSignedIn()) return;
    const song = this.song;
    if (!song) return;
    if (song.songLike !== SongLike.Liked) {
      song.songLike = SongLike.Liked;
      this.isThumbingUpOrDown = true;
      this.requestUpdate();
      likeApi
        .likeSong(song.id)
        .then((rank) => (song.communityRank = rank))
        .finally(() => {
          this.isThumbingUpOrDown = false;
          this.requestUpdate();
        });
    } else {
      this.setSongAsUnranked(song);
    }
  }

  private thumbDownClicked(): void {
    if (!this.ensureSignedIn()) return;
    const song = this.song;
    if (!song) return;
    if (song.songLike !== SongLike.Disliked) {
      song.songLike = SongLike.Disliked;
      this.isThumbingUpOrDown = true;
      this.requestUpdate();
      likeApi
        .dislikeSong(song.id)
        .then((rank) => (song.communityRank = rank))
        .finally(() => {
          this.isThumbingUpOrDown = false;
          this.requestUpdate();
        });
      songBatch.playNext();
    } else {
      this.setSongAsUnranked(song);
    }
  }

  private setSongAsUnranked(song: Song): void {
    song.songLike = SongLike.Unranked;
    this.isThumbingUpOrDown = true;
    this.requestUpdate();
    likeApi
      .setSongAsUnranked(song.id)
      .then((rank) => (song.communityRank = rank))
      .finally(() => {
        this.isThumbingUpOrDown = false;
        this.requestUpdate();
      });
  }

  private requestSong(): void {
    this.ensureSignedIn();
  }

  private toggleVolumeShown(): void {
    this.volumeShown = !this.volumeShown;
  }

  private onVolumeInput(e: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value);
    this.volume = isNaN(val) ? 1 : val;
    audioPlayer.volume = this.volume;
  }

  render() {
    return html`
      ${this.styles()}
      <section class="footer">
        ${this.isBuffering
          ? html`<div class="buffering"><div class="buffering-bar"></div></div>`
          : html`<div class="trackbar" style="width:${this.trackPercent}%"></div>`}

        <div class="song-controls">
          <wa-tooltip for="thumb-down-btn">${this.dislikeText}</wa-tooltip>
          <wa-button
            id="thumb-down-btn"
            class="ctl ${this.dislikesCurrentSong ? "active" : ""}"
            appearance="plain"
            ?disabled=${this.isThumbingUpOrDown}
            @click=${() => this.thumbDownClicked()}
          >
            <wa-icon name="thumbs-down"></wa-icon>
          </wa-button>

          <wa-tooltip for="request-btn">Got a song request? Chavah will play whatever tune's on your mind.</wa-tooltip>
          <wa-button id="request-btn" class="ctl" appearance="plain" @click=${() => this.requestSong()}>
            <wa-icon name="comment"></wa-icon>
          </wa-button>

          <wa-button class="ctl play-pause" appearance="plain" @click=${() => this.playPause()}>
            <wa-icon name=${this.isPaused ? "play" : "pause"} style="font-size:1.6em"></wa-icon>
          </wa-button>

          <wa-tooltip for="skip-btn">Skip this song, play something else</wa-tooltip>
          <wa-button id="skip-btn" class="ctl" appearance="plain" @click=${() => this.playNextSong()}>
            <wa-icon name="forward-fast"></wa-icon>
          </wa-button>

          <wa-tooltip for="thumb-up-btn">${this.likeText}</wa-tooltip>
          <wa-button
            id="thumb-up-btn"
            class="ctl ${this.likesCurrentSong ? "active" : ""}"
            appearance="plain"
            ?disabled=${this.isThumbingUpOrDown}
            @click=${() => this.thumbUpClicked()}
          >
            <wa-icon name="thumbs-up"></wa-icon>
          </wa-button>

          <div class="volume-and-track-time">
            <span class="track-time-container">
              <span class="track-time">${this.trackTime}</span> | <span class="track-duration">${this.trackDuration}</span>
            </span>
            <wa-button class="ctl" appearance="plain" @click=${() => this.toggleVolumeShown()}>
              <wa-icon name=${this.volumeIconName}></wa-icon>
            </wa-button>
            <input
              class="volume-slider"
              type="range"
              min="0"
              step="0.1"
              max="1"
              .value=${String(this.volume)}
              style=${this.volumeShown ? "" : "display:none"}
              @input=${(e: Event) => this.onVolumeInput(e)}
            />
          </div>
        </div>

        <a
          class="discord-chat"
          href="https://discord.gg/gKrqH4MApy"
          target="_blank"
          rel="noopener"
          style=${this.volumeShown ? "visibility:hidden" : "visibility:initial"}
        >
          <img src="/images/discord.svg" width="35" height="35" loading="lazy" alt="Discord" />
        </a>

        <audio id="audio"></audio>
      </section>
    `;
  }

  private styles() {
    return html`<style>
      chavah-footer .footer {
        position: fixed;
        width: 100%;
        bottom: 0;
        left: 0;
        text-align: center;
        background-color: var(--chavah-brand);
        z-index: 100;
        padding-bottom: env(safe-area-inset-bottom);
      }
      chavah-footer .song-controls {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 56px;
      }
      chavah-footer .footer .ctl::part(base) {
        color: #ffffff;
        font-size: 20px;
        transition: all 0.2s linear;
      }
      chavah-footer .footer .ctl:hover::part(base) {
        background-color: var(--chavah-brand-light);
        color: var(--chavah-title);
      }
      chavah-footer .footer .ctl.active::part(base) {
        color: var(--chavah-title);
        text-shadow: 0 0 30px var(--chavah-title);
      }
      chavah-footer .trackbar {
        position: absolute;
        top: 0;
        left: 0;
        transition: 1.1s;
        height: 3px;
        width: 0;
        background-color: rgba(255, 255, 255, 0.5);
      }
      chavah-footer .buffering {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 6px;
        overflow: hidden;
        opacity: 0.6;
      }
      chavah-footer .buffering-bar {
        height: 100%;
        width: 40%;
        background: repeating-linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.6),
          rgba(255, 255, 255, 0.6) 10px,
          rgba(255, 255, 255, 0.3) 10px,
          rgba(255, 255, 255, 0.3) 20px
        );
        animation: chavah-buffer 1.2s linear infinite;
      }
      @keyframes chavah-buffer {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(350%);
        }
      }
      chavah-footer .volume-and-track-time {
        position: absolute;
        right: 0;
        bottom: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      chavah-footer .track-time-container {
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
      }
      chavah-footer .volume-slider {
        position: absolute;
        top: -135px;
        right: 21px;
        writing-mode: vertical-rl;
        direction: rtl;
        width: 15px;
        height: 120px;
        accent-color: var(--chavah-title);
      }
      chavah-footer .discord-chat {
        width: 50px;
        height: 50px;
        position: absolute;
        bottom: 100px;
        right: 20px;
        background-color: var(--chavah-brand);
        border-radius: 50px;
        box-shadow: 0 0 5px 1px gray;
        transition: transform ease-in-out 0.5s;
        opacity: 0.5;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      chavah-footer .discord-chat img {
        filter: invert(0.9);
      }
      chavah-footer .discord-chat:hover {
        opacity: 1;
        transform: rotateZ(360deg);
      }
      chavah-footer audio {
        display: none;
      }
      @media (max-width: 767px) {
        chavah-footer .volume-and-track-time {
          display: none;
        }
      }
      @media (max-width: 575px) {
        chavah-footer .discord-chat {
          display: none;
        }
      }
    </style>`;
  }
}
