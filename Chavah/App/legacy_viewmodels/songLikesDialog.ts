import Dialog = require("plugins/dialog");
import Song = require("models/song");
import GetLikedSongsCommand = require("commands/getLikedSongsCommand");

class SongLikesDialog {
    results = ko.observableArray<Song>();
    hasMultiplePages: KnockoutComputed<boolean>;
    isOnFirstPage: KnockoutComputed<boolean>;
    isOnLastPage: KnockoutComputed<boolean>;
    pagesCount: KnockoutComputed<number>;
    currentResultsPage = ko.observable(0);
    totalResultsCount = ko.observable(0);
    resultPages: KnockoutComputed<number[]>;
    hasZeroResults = ko.observable(false);
    
    resultsPerPage = 25;

    constructor() {
        this.pagesCount = ko.computed(() => Math.ceil(this.totalResultsCount() / this.resultsPerPage));
        this.isOnFirstPage = ko.computed(() => this.currentResultsPage() === 0);
        this.isOnLastPage = ko.computed(() => this.currentResultsPage() === this.pagesCount() - 1);
        this.resultPages = ko.computed(() => this.pagesCount() > 0 ? new Array(this.pagesCount()) : []);

        this.currentResultsPage.subscribe(() => this.fetchLikes());
    }

    activate() {
        this.fetchLikes();
    }

    fetchLikes() {
        var currentPage = this.currentResultsPage();
        var skip = currentPage * this.resultsPerPage;
        var take = this.resultsPerPage;
        NProgress.start();
        new GetLikedSongsCommand(skip, take)
            .execute()
            .done((results: PagedListDto<Song>) => {
                if (currentPage === this.currentResultsPage()) {
                    this.results(results.Items);
                    this.totalResultsCount(results.Total);
                    this.hasZeroResults(results.Total === 0);
                }
            })
            .always(() => NProgress.done());
    }

    goToPage(pageIndex: number) {
        this.currentResultsPage(pageIndex);
    }

    nextPage() {
        this.currentResultsPage(this.currentResultsPage() + 1);
    }

    previousPage() {
        this.currentResultsPage(this.currentResultsPage() - 1);
    }

    close() {
        Dialog.close(this);
    }

    selectSongAndClose(song: Song) {
        Dialog.close(this, song);
    }
}

export = SongLikesDialog;