import GetAdminSongsCommand = require("commands/getAdminSongsCommand");
import Song = require("models/song");
import AdminEditSongDialog = require("viewmodels/adminEditSongDialog");
import Dialog = require("plugins/dialog");
import GetSongMatchesCommand = require("commands/getSongMatchesCommand");
import filepicker = require("filepicker");
import UploadSongCommand = require("commands/uploadSongCommand");
import DeleteSongCommand = require("commands/deleteSongCommand");

class adminSongs {
    resultsPerPage = 10;
    page = ko.observable(0);
    songs = ko.observableArray<Song>();
    searchText = ko.observable<string>();

    activate() {
        this.getSongs();
        this.searchText.extend({ throttle: 500 }).subscribe(search => this.runSearch(search));
        filepicker.setKey("AwdRIarCGT8COm0mkYX1Ez");
    }

    getSongs() {
        var currentPage = this.page();
        var skip = currentPage * this.resultsPerPage;
        var take = this.resultsPerPage;
        new GetAdminSongsCommand(skip, take)
            .execute()
            .done((results: server.PagedList) => {
                if (this.page() === currentPage) {
                    this.songs(results.Items);
                }
            });
    }

    editSong(song: Song) {
        var viewModel = new AdminEditSongDialog(song);
        Dialog.show(viewModel);
    }

    runSearch(search: string) {
        if (search && search.length > 2) {
            new GetSongMatchesCommand(search)
                .execute()
                .done((songs: Song[]) => {
                    if (this.searchText() === search) {
                        this.songs(songs);
                    }
                });
        } else {
            this.getSongs();
        }
    }

    uploadSong() {
        var options: FilepickerMultipleFilePickOptions = {
            extension: ".mp3"
        };
        filepicker.pickMultiple(options, (results: FilepickerInkBlob[]) => this.onFilePicked(results));
    }

    onFilePicked(files: FilepickerInkBlob[]) {
        NProgress.start();
        var uploadTasks = files.map(f => new UploadSongCommand(f.url, f.filename).execute());
        $.when(uploadTasks)
            .always(() => NProgress.done())
            .done(() => this.getSongs());
        //new UploadSongCommand(file.url, file.filename)
        //    .execute()
        //    .done(() => this.getSongs())
        //    .always(() => NProgress.done());
    }

    confirmDeleteSong(song: Song) {
        var deleteConfirmMessage = "You're deleting " + song.artist + " - " + song.name;
        var yes = "Yep, delete";
        var no = "No, cancel";
        Dialog
            .showMessage(deleteConfirmMessage, "Delete?", [yes, no])
            .done((result: string) => {
                if (result === yes) {
                    this.deleteSong(song);
                }
            });
    }

    deleteSong(song: Song) {
        NProgress.start();
        new DeleteSongCommand(song)
            .execute()
            .always(() => NProgress.done())
            .done(() => {
                this.getSongs();
            });
    }
}

export = adminSongs;