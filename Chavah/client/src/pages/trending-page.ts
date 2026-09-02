import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { songApi } from "../services/song-api-service";
import { PagedList } from "../shared/paged-list";
import { Song } from "../models/song";
import "../components/song-deck";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Recently thumbed-up songs. Ported from `views/Trending.html` +
 * `TrendingController`.
 */
@customElement("trending-page")
export class TrendingPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  private songsList = new PagedList<Song>((skip, take) => songApi.getTrendingSongs(skip, take));

  constructor() {
    super();
    this.songsList.take = 25;
  }

  render() {
    return html`
      <section class="page trending-page">
        <h2 class="page-title">
          <wa-icon name="chart-line"></wa-icon> Trending <br />
          <small>Recently thumbed-up <wa-icon name="thumbs-up"></wa-icon> songs</small>
        </h2>
        <song-deck .songs=${this.songsList} .showLoadMore=${false}></song-deck>
      </section>
    `;
  }
}
