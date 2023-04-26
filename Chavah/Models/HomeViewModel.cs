using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Services;
using BitShuva.Chavah.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Models;

/// <summary>
/// View model for the home page.
/// </summary>
public class HomeViewModel
{
    private readonly FingerprintedResourceService fingerprintedResSvc;
    private readonly IAsyncDocumentSession db;

    public HomeViewModel(
        FingerprintedResourceService fingerprintedResourcesService,
        IAsyncDocumentSession db,
        IOptions<AppSettings> appSettings,
        IOptions<CdnSettings> cdnSettings)
    { 
        this.fingerprintedResSvc = fingerprintedResourcesService;
        this.db = db;
        this.CdnUrl = cdnSettings.Value.HttpPath;
        this.SoundEffects = cdnSettings.Value.HttpPath.Combine(cdnSettings.Value.SoundEffects);
        this.IsDownForMaintenance = appSettings.Value.IsDownForMaintenance;
        this.GoogleAnalytics = appSettings.Value.GoogleAnalytics;
    }

    /// <summary>
    /// The fingerprinted JS file produced by the client app's production build (npm run build).
    /// </summary>
    public Uri? IndexJsUrl { get; set; }

    /// <summary>
    /// The fingerprinted CSS file producted by the client app's production build (npm run build).
    /// </summary>
    public Uri? IndexCssUrl { get; set; }

    /// <summary>
    /// The currently signed in user, or null if there is no user signed in.
    /// </summary>
    public UserViewModel? User { get; set; }

    /// <summary>
    /// The Chavah's Google Analytics ID.
    /// </summary>
    public string GoogleAnalyticsId { get; set; }

    /// <summary>
    /// Whether the app is running in debug mode.
    /// </summary>
#if DEBUG
    public bool Debug { get; init; } = true;
#else
    public bool Debug { get; init; } 
#endif

    /// <summary>
    /// The URL to redirect to. This may be null.
    /// </summary>
    public string? Redirect { get; set; }

    /// <summary>
    /// Whether the page is being loaded in an embedded iframe.
    /// </summary>
    public bool Embed { get; set; }

    /// <summary>
    /// The page title.
    /// </summary>
    public string Title { get; set; } = "Chavah Messianic Radio";

    /// <summary>
    /// Gets the page description.
    /// </summary>
    public string Description { get; set; } = "The very best Messianic Jewish music on the web";

    /// <summary>
    /// Keywords metadata for the page.
    /// </summary>
    public string Keywords { get; set; } = "messianic jewish music,messianic music,hebrew roots music,jewish christian music,messianic radio,christian music";

    /// <summary>
    /// The URI for the social card.
    /// </summary>
    public Uri SocialCardUrl { get; set; } = new Uri("https://messianicchords.com");

    /// <summary>
    /// The type of Twitter card to use.
    /// </summary>
    public string TwitterCardType { get; set; } = "summary"; // For possible values, see https://ogp.me/

    /// <summary>
    /// The type of Facebook (Open Graph) card to use.
    /// </summary>
    public string FacebookCardType { get; set; } = "music.radio_station"; // For possible values, see https://developers.facebook.com/docs/sharing/webmasters

    /// <summary>
    /// The image to use for the social card.
    /// </summary>
    public Uri SocialCardImage { get; set; } = new Uri("https://messianicradio.com/assets/images/brand/512x512.png");

    /// <summary>
    /// The Twitter handle to use for the Twitter social card.
    /// </summary>
    public string TwitterHandle { get; set; } = "@MessianicRadio";

    /// <summary>
    /// The HTTP URL of the CDN.
    /// </summary>
    public Uri CdnUrl { get; set; }

    /// <summary>
    /// The sound effects list.
    /// </summary>
    public Uri SoundEffects { get; set; }

    /// <summary>
    /// Gets whether Chavah is down for maintenance.
    /// </summary>
    public bool IsDownForMaintenance { get; set; }

    /// <summary>
    /// Gets the public key for Service Worker push notifications.
    /// </summary>
    public string PushNotificationsPublicKey { get; set; } = string.Empty;

    /// <summary>
    /// Converts the view model to a JSON object.
    /// </summary>
    /// <returns></returns>
    public string ToJson()
    {
        return System.Text.Json.JsonSerializer.Serialize(this, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }

    /// <summary>
    /// Updates the view model to include information about the specified song, album, or artist.
    /// Additionally, updates the view model to include the fingerprinted production JS and CSS resources if they exist.
    /// </summary>
    /// <param name="songId"></param>
    /// <param name="albumName"></param>
    /// <param name="artistName"></param>
    /// <param name="embedded"></param>
    /// <returns></returns>
    public async Task Update(string? songId, string? albumName, string? artistName, bool embedded)
    {
        // Grab the fingerprinted resources.
        var (js, css) = await fingerprintedResSvc.GetResourcesAsync();
        IndexJsUrl = js;
        IndexCssUrl = css;

        // See if we've been given a song ID.
        if (!string.IsNullOrWhiteSpace(songId))
        {
            await this.UpdateFromSong(songId);
        }
        // See if we've been given an artist and album.
        else if (!string.IsNullOrWhiteSpace(artistName) && !string.IsNullOrWhiteSpace(albumName))
        {
            await this.UpdateFromArtistAndAlbum(artistName, albumName);
        }
        // See if we've been given an artist.
        else if (!string.IsNullOrWhiteSpace(artistName))
        {
            await this.UpdateFromArtist(artistName);
        }
        // See if we've been given an album.
        else if (!string.IsNullOrWhiteSpace(albumName))
        {
            await this.UpdateFromAlbum(albumName);
        }

        this.Embed = embedded;
    }

    private async Task UpdateFromSong(string songId)
    {
        var song = await db.LoadOptionalAsync<Song>(songId);
        if (song != null)
        {
            this.Title = $"{song.GetFullName()} by {song.Artist} - {this.Title}";
            this.Description = $"{song.GetFullName()} by {song.Artist} on {song.Album} - {this.Description}";
            this.Keywords = string.Join(", ", new[] { song.GetFullName(), song.Artist, Keywords });
            this.SocialCardImage = song.AlbumArtUri;
            this.SocialCardUrl = new Uri($"https://messianicradio.com/?song={song.Id}");
            this.FacebookCardType = "music.song";
        }
    }

    private async Task UpdateFromArtistAndAlbum(string artist, string album)
    {
        var song = await db.Query<Song, Songs_GeneralQuery>()
                .FirstOrDefaultAsync(s => s.Artist == artist && s.Album == album);
        if (song != null)
        {
            this.Title = $"{song.Album} by {song.Artist} - {this.Title}";
            this.Description = $"Songs from {song.Album} by {song.Artist} on {song.Album} - ${this.Description}";
            this.Keywords = string.Join(", ", new[] { song.Artist, song.Album, $"Songs by {song.Artist}", $"Songs on {song.Album} album", Keywords });
            this.SocialCardImage = song.AlbumArtUri;
            this.SocialCardUrl = new Uri($"https://messianicradio.com/?artist={Uri.EscapeDataString(song.Artist)}&album={Uri.EscapeDataString(song.Album)}");
            this.FacebookCardType = "music:album";
        }
    }

    private async Task UpdateFromArtist(string artistName)
    {
        var song = await db.Query<Song, Songs_GeneralQuery>()
            .Customize(x => x.RandomOrdering())
            .Include(s => s.ArtistId)
            .FirstOrDefaultAsync(s => s.Artist == artistName);
        var artist = await db.LoadOptionalAsync<Artist>(song?.ArtistId);
        if (song != null && artist != null)
        {
            this.Title = $"{song.Artist} songs - {this.Title}";
            this.Description = $"Songs by {song.Artist} - ${this.Description}";
            this.Keywords = string.Join(", ", new[] { song.Artist, $"Songs by {song.Artist}", Keywords });
            this.SocialCardImage = artist.Images.FirstOrDefault() ?? song.AlbumArtUri;
            this.SocialCardUrl = new Uri($"https://messianicradio.com/?artist={Uri.EscapeDataString(song.Artist)}");
            this.FacebookCardType = "music:musician";
        }
    }

    private async Task UpdateFromAlbum(string albumName)
    {
        var song = await db.Query<Song, Songs_GeneralQuery>()
            .FirstOrDefaultAsync(s => s.Album == albumName);
        if (song != null)
        {
            this.Title = $"{song.Album} songs - {this.Title}";
            this.Description = $"Songs on {song.Album} album - ${this.Description}";
            this.Keywords = string.Join(", ", new[] { song.Album, $"Songs from {song.Album} album", song.Artist, Keywords });
            this.SocialCardImage = song.AlbumArtUri;
            this.SocialCardUrl = new Uri($"https://messianicradio.com/?album={Uri.EscapeDataString(song.Album)}");
            this.FacebookCardType = "music:album";
        }
    }

    //public static HomeViewModel From(
    //    UserViewModel? user,
    //    Song? song,
    //    AppSettings appOptions,
    //    CdnSettings cdnOptions)
    //{
    //    var vm = new HomeViewModel
    //    {
    //        Title = appOptions.Title,
    //        Description = appOptions.Description,
    //        DefaultUrl = appOptions.DefaultUrl,
    //        CdnUrl = cdnOptions.HttpPath,
    //        SoundEffects = new System.Uri(cdnOptions.HttpPath).Combine(cdnOptions.SoundEffects).ToString(),
    //        User = user,
    //        Song = song,
    //        IsDownForMaintenance = appOptions.IsDownForMaintenance,
    //        PushNotificationsPublicKey = appOptions.PushNotificationsPublicKey
    //    };

    //    if (song != null)
    //    {
    //        vm.Title = $"{song.Name} by {song.Artist} on {appOptions.Title}";
    //        vm.DescriptiveImageUrl = song.AlbumArtUri?.ToString();
    //        vm.Song = song;
    //        vm.SongNth = song.Number.ToNumberWord();
    //    }

    //    return vm;
    //}
}
