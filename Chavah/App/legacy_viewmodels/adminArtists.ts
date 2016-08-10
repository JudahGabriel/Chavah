import GetArtistsCommand = require("commands/getArtistsCommand");
import Dialog = require("plugins/dialog");
import AdminEditArtistDialog = require("viewmodels/adminEditArtistDialog");
import DeleteArtistCommand = require("commands/deleteArtistCommand");

class AdminArtists {
    artists = ko.observableArray<server.Artist>();
    skip = 0;
    take = 25;
    searchText = ko.observable("").extend({ throttle: 500 });
    totalItems = ko.observable<number>();

    constructor() {
        this.runArtistQuery();
        this.searchText.subscribe(() => this.runArtistQuery());
    }

    runArtistQuery() {
        this.artists([]);
        this.getArtists();
    }

    getArtists() {
        new GetArtistsCommand(this.searchText(), this.skip, this.take)
            .execute()
            .done((results: server.PagedList) => {
                this.artists(this.artists().concat(results.Items));
                this.totalItems(results.Total);
            });
    }

    getArtistImageCountText(artist: server.Artist) {
        return artist.Images.length + " artist photos";
    }

    newArtist() {
        this.editArtist(null);
    }

    editArtist(artist: server.Artist) {
        var viewModel = new AdminEditArtistDialog(artist);
        Dialog
            .show(viewModel)
            .done((artist: server.Artist) => {
                if (artist) {
                    this.artists.unshift(artist);
                }
            });
    }

    confirmDeleteArtist(artist: server.Artist) {
        var deleteConfirmMessage = "You're deleting " + artist.Name;
        var yes = "Yep, delete";
        var no = "No, cancel";
        Dialog
            .showMessage(deleteConfirmMessage, "Delete?", [yes, no])
            .done((result: string) => {
                if (result === yes) {
                    this.deleteArtist(artist);
                }
            });
    }

    deleteArtist(artist: server.Artist) {
        NProgress.start();
        new DeleteArtistCommand(artist)
            .execute()
            .always(() => NProgress.done())
            .done(() => this.runArtistQuery());
    }
}

export = AdminArtists;