import Song = require("models/song");
import GetArtistCommand = require("commands/getArtistCommand");

class ArtistImageRotater {
    private artistImagesMap = {};
    private albumArtRotateTimeoutHandle = 0;
    private albumArtRotateTimeout = 25000;

    constructor(private currentSong: KnockoutObservable<Song>) {
        currentSong.subscribe(s => this.currentSongChanged(s));
    }

    currentSongChanged(s: Song) {
        clearTimeout(this.albumArtRotateTimeoutHandle);
        this.fetchAlbumArt(s.artist)
            .done((images: string[]) => this.scheduleImageRotation(s, images));
    }

    fetchAlbumArt(artistName: string): JQueryPromise<string[]> {
        var task = $.Deferred<string[]>();
        var existingImages = this.artistImagesMap[artistName];
        if (existingImages) {
            task.resolve(existingImages);
        }

        new GetArtistCommand(artistName)
            .execute()
            .done((artist: ArtistDto) => {
                var images = artist ? artist.Images : [];
                this.artistImagesMap[artistName] = images;
                task.resolve(images);
            });

        return task;
    }

    scheduleImageRotation(song: Song, artistImages: string[]) {
        if (song === this.currentSong() && artistImages.length > 0) {
            this.albumArtRotateTimeoutHandle = setTimeout(() => this.rotateAlbumArt(song, artistImages), this.albumArtRotateTimeout);
        }
    }

    rotateAlbumArt(song: Song, artistImages: string[]) {
        if (song === this.currentSong() && artistImages.length) {
            var allImages = artistImages
                .concat(song.albumArtUri)
                .filter(a => a != song.albumArtOrArtistImage());
            if (allImages.length > 0) {
                var randomImage = allImages[Math.floor(Math.random() * allImages.length)];
                var albumArtSelector = ".current-song .album-art img:first";
                $(albumArtSelector).fadeOut("slow", function () {
                    song.albumArtOrArtistImage(randomImage);
                    $(albumArtSelector).fadeIn(1000);
                });
            }

            this.scheduleImageRotation(song, artistImages);
        }
    }
}

export = ArtistImageRotater;