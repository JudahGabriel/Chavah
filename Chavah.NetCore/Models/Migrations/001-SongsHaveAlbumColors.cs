using Raven.Migrations;

namespace BitShuva.Chavah.Models.Migrations
{
    /// <summary>
    /// In this migration, we've denormalized album colors into the song.
    /// This is needed because nearly every context where we display a song in the UI, we want to also display the album colors for that song.
    /// Previously, album colors were stored only on Album. Now they're also stored on all songs in an album.
    /// </summary>
    [Migration(1)]
    public class SongsHaveAlbumColors : Migration
    {
        public override void Up()
        {
            PatchCollection(@"
                from Songs as song
                load song.AlbumId as album
                update {
                    song.AlbumColors = {
                        Foreground: album ? album.ForegroundColor : '',
                        Background: album ? album.BackgroundColor : '',
                        Muted: album ? album.MutedColor : '',
                        TextShadow: album ? album.TextShadowColor : ''
                    };
                }
            ");
        }
    }
}
