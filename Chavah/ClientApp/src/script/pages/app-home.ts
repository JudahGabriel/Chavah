import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import '../components/chord-card';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { SizeMax } from '../common/constants';
import { ChordService } from '../services/chord-service';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
@customElement('app-home')
export class AppHome extends BootstrapBase {

  static get styles() {
    const localStyles = css`

      :host {
        font-family: var(--subtitle-font);
      }

      @media (max-width: ${SizeMax.Md}px) {
        .home-page {
          margin-top: -30px;
        }
      }

      .search-container {
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: var(--subtitle-font);
      }

      /* On phones and tablets, make the search container margin cancel out the parent's padding */
      @media (max-width: ${SizeMax.Sm}px) {
          .search-container {
              margin-left: -20px;
              margin-right: -20px;
          }
      }

      .search-container .search-box-brace {
          font-size: 100px;
          padding: 10px;
          color: brown;
          text-shadow: 1px 1px 1px gray;
          vertical-align: text-bottom;
      }

      #search-box {
          line-height: 50px;
          width: 500px;
          border: 1px solid rgba(0, 0, 0, 0.0976563);
          height: 100px;
          padding-left: 10px;
          color: #0b0974;
          font-size: 32px;
          margin-top: 20px;
      }

      #search-box::placeholder {
          color: rgb(192, 192, 192) !important;
          font-style: italic;
          font-family: serif;
          font-size: 24px !important;
      }


      @media (max-width: ${SizeMax.Xs}px) {
          #search-box {
              width: 90%;
          }
      }

      nav a {
        color: var(--theme-color);
        text-decoration: none;
      }

      nav span {
        font-family: var(--subtitle-font);
      }

      .new-chords {
        justify-content: center;
        flex-direction: row;
        align-items: center;
      }

      .new-chords-placeholder-container {
        width: 400px;
      }

      @media (max-width: ${SizeMax.Xs}px) {
        .new-chords-placeholder-container {
          width: 100%;
        }
      }

      @media (max-width: ${SizeMax.Xs}px) {
          .new-chords {
              flex-direction: column;
              align-items: center;
              margin-bottom: 10px;
          }
      }

      .new-chords a {
          padding-left: 5px;
          padding-right: 5px;
      }

      @media (max-width: ${SizeMax.Xs}px) {
          .new-chords a {
              text-overflow: ellipsis
              overflow: hidden;
              white-space: nowrap;
              width: 100%;
              display: inline-block;
              max-width: 300px;
              padding: 4px;
          }
      }

      .loading-block {
        text-align: center;
        margin: 50px;
      }

      .search-results-container {
        margin-top: 50px;
      }

      @media (max-width: ${SizeMax.Xs}px) {
        margin-top: 20px;
      }
    `;

    return [
      super.styles,
      localStyles
    ];
  }

  @state() newChords: ChordSheet[] = [];
  @state() isLoading = false;
  @state() searchResults: ChordSheet[] = [];
  @state() newChordsSkip = 0;
  readonly chordService = new ChordService();
  readonly searchText = new BehaviorSubject("");

  constructor() {
    super();
  }

  // Lit callback when component is attached to the DOM
  connectedCallback() {
    super.connectedCallback();

    // See if we're configured to run a query.
    if (window.location.search) {
      const query = new URLSearchParams(window.location.search).get("search");
      this.searchText.next(query || "");
    }

    // Listen for search text changed (debounced).
    this.searchText
      .pipe(
        debounceTime(250),
        distinctUntilChanged()
      )
      .subscribe(searchText => this.runSearch(searchText));

    // Fetch new chords
    this.fetchNextNewChords();
  }

  searchTextChanged(e: Event) {
    const searchText = (e.target! as HTMLInputElement).value;
    this.searchText.next(searchText);
  }

  async fetchNextNewChords() {
    const take = 3;
    var pagedResult = await this.chordService.getNew(this.newChordsSkip, take);
    this.newChords = pagedResult.results;
    this.newChordsSkip += take;
  }

  updateSearchQueryString(search: string) {
    if (search) {
      history.pushState({}, "", `?search=${encodeURIComponent(search)}`);
      document.title = `'${search}' search on Messianic Chords`;

    } else {
      history.pushState({}, "", "/");
      document.title = "Messianic Chords";
    }
  }

  async runSearch(query: string) {
    if (!query) {
      this.isLoading = false;
      this.searchResults = [];
      this.updateSearchQueryString("");
      return;
    }

    this.isLoading = true;
    this.updateSearchQueryString(query);
    try {
      const results = await this.chordService.search(query);
      const isStillWaitingForResults = query === this.searchText.value;
      if (isStillWaitingForResults) {
        this.searchResults = results;
        this.isLoading = false;
      }
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    const navClass = this.searchResults.length > 0 ? "d-none" : "";
    return html`
      <section class="home-page container">

        <div class="search-container">
          <span class="search-box-brace">{</span>
          <input id="search-box" class="form-control" type="text" placeholder="Type a song, artist, or partial lyric"
            @input="${this.searchTextChanged}" autofocus value="${this.searchText.value}" />
          <span class="search-box-brace">}</span>
        </div>
        <nav class="text-center ${navClass}">
          <span>Browse:</span>
          <br class="d-block d-sm-none" />
          <a class="fw-bold" href="/browse/newest">Newest</a>
          <span class="bar-separator">&nbsp;|&nbsp;</span>
          <a class="fw-bold" href="/browse/songs">By song</a>
          <span class="bar-separator">&nbsp;|&nbsp;</span>
          <a class="fw-bold" href="/browse/artists">By artist</a>
          <span class="bar-separator">&nbsp;|&nbsp;</span>
          <a class="fw-bold" href="/browse/random">Random</a>

          <div class="new-chords text-center mt-2 d-flex">
            <span>New chords:</span>
            ${this.renderNewChords()}
            <button class="btn btn-light ms-2" @click="${this.fetchNextNewChords}" .disabled=${this.newChords.length===0}>Load
              more...</button>
          </div>

          <div class="d-flex justify-content-center">
            <div class="site-text">
              Got chords to share?
              <a class="fw-bold" href="/chordsheets/new">Upload</a>
            </div>
          </div>
        </nav>

        ${this.renderLoading()}

        <div class="search-results-container w-100 d-flex flex-wrap justify-content-evenly align-items-stretch">
          ${repeat(this.searchResults, c => c.id, c => this.renderSearchResult(c))}
        </div>
      </section>`;
  }

  renderNewChords(): TemplateResult {
    if (this.newChords.length === 0) {
      return this.renderNewChordsPlaceholder();
    }

    return html`
      ${repeat(this.newChords, c => c.id, (c, index) => this.renderNewChordLink(c, index))}
    `;
  }

  renderNewChordsPlaceholder(): TemplateResult {
    return html`
      <div class="new-chords-placeholder-container placeholder-glow row ms-sm-2 my-1 my-sm-auto">
        <span class="placeholder col-4 mx-2 d-none d-sm-block"></span>
        <span class="placeholder col-3 mx-2 d-none d-sm-block"></span>
        <span class="placeholder col-4 mr-1 d-none d-sm-block"></span>
        <span class="placeholder col-12 d-block d-sm-none"></span>
      </div>
    `;
  }

  renderNewChordLink(newChordSheet: ChordSheet, index: number): TemplateResult {
    const songName = [newChordSheet.song, newChordSheet.hebrewSongName]
      .filter(s => !!s)
      .join(' ');
    const title = newChordSheet.key ?
      html`${songName} - ${newChordSheet.key}` :
      html`${songName}`;
    const separator = index != this.newChords.length - 1 ?
      html`<span class="bar-separator d-none d-sm-inline">&nbsp;|&nbsp;</span>` :
      html``;
    return html`
      <div class="d-inline-block">
        <a class="fw-bold" href="/${newChordSheet.id}">
          ${title}
        </a>
        ${separator}
      </div>
    `;
  }

  renderLoading(): TemplateResult {
    if (!this.isLoading) {
      return html``;
    }

    return html`
      <div class="loading-block">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="site-text">Searching, one moment...</span>
      </div>
    `;
  }

  renderSearchResult(chordSheet: ChordSheet): TemplateResult {
    return html`
      <chord-card .chord="${chordSheet}"></chord-card>
    `;
  }
}
