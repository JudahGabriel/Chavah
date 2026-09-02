import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { songApi } from "../services/song-api-service";
import { PagedList } from "../shared/paged-list";
import { Song } from "../models/song";
import "../components/song-deck";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Songs with the highest ranking on Chavah. Ported from `views/Popular.html` +
 * `PopularController`.
 */
@customElement("popular-page")
export class PopularPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  private songsList = new PagedList<Song>((skip, take) => songApi.getPopular(skip, take));

  constructor() {
    super();
    this.songsList.take = 25;
  }

  render() {
    return html`
      <section class="page popular-page">
        <h2>
          <wa-icon name="star" style="color: goldenrod;"></wa-icon> Popular <br />
          <small>Songs with the highest ranking on Chavah</small>
        </h2>
        <song-deck .songs=${this.songsList} .showLoadMore=${true}></song-deck>
      </section>
    `;
  }
}
