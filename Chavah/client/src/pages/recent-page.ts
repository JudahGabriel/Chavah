import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { songApi } from "../services/song-api-service";
import { PagedList } from "../shared/paged-list";
import { Song } from "../models/song";
import type { PagedList as ServerPagedList } from "../models/server-interfaces";
import "../components/song-deck";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Songs the current user recently listened to. Ported from `views/Recent.html`
 * + `RecentController`. Recent plays come back as a plain array (only ~10 are
 * kept per user), so we wrap it in a `PagedList`-shaped result.
 */
@customElement("recent-page")
export class RecentPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  private songsList = new PagedList<Song>((skip, take) => this.getRecentAsPagedList(skip, take));

  constructor() {
    super();
    this.songsList.take = 25;
  }

  private getRecentAsPagedList(skip: number, take: number): Promise<ServerPagedList<Song>> {
    return songApi.getRecentPlays(take).then((results) => ({
      items: results,
      skip,
      take,
      total: results.length,
    }));
  }

  render() {
    return html`
      <section class="page recent-page">
        <h2 class="page-title">
          <wa-icon name="backward-step"></wa-icon> Recent <br />
          <small>Songs you recently listened to</small>
        </h2>
        <song-deck .songs=${this.songsList} .showLoadMore=${false}></song-deck>
      </section>
    `;
  }
}
