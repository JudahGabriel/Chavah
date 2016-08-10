import Dialog = require("plugins/dialog");
import filepicker = require("filepicker");
import SaveArtistCommand = require("commands/saveArtistCommand");

class AdminEditArtistDialog {
    newImages = ko.observableArray<string>();

    constructor(private artist?: server.Artist) {
        if (!artist) {
            artist = {
                Id: "",
                Bio: "",
                Images: [],
                Name: ""
            };
            this.artist = artist;
        }

        this.newImages(artist.Images);
        filepicker.setKey("AwdRIarCGT8COm0mkYX1Ez");
    }

    save() {
        this.artist.Images = this.newImages();
        new SaveArtistCommand(this.artist)
            .execute()
            .done(() => Dialog.close(this));
    }

    close() {
        Dialog.close(this);
    }

    pickArtistPhoto() {
        var options: FilepickerMultipleFilePickOptions = {
            mimetype: "image/*",
            maxFiles: 25,
            folders: false
        };
        filepicker.pickMultiple(options, (results: FilepickerInkBlob[]) => this.photoPicked(results));
    }

    photoPicked(files: FilepickerInkBlob[]) {
        files
            .map(f => f.url)
            .forEach(f => this.newImages.push(f));
    }
}

export = AdminEditArtistDialog;