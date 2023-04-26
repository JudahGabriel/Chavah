using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Settings;
using BitShuva.Chavah.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Raven.Client.Documents;
using Raven.Client.Documents.Linq;
using Raven.Client.Documents.Session;
using Microsoft.AspNetCore.Http;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class AlbumsController : RavenController
    {
        private readonly ICdnManagerService cdnManagerService;
        private readonly ISongUploadService songUploadService;
        private readonly AppSettings appOptions;

        public AlbumsController(
            ICdnManagerService cdnManagerService,
            ISongUploadService songUploadService,
            IAsyncDocumentSession dbSession,
            ILogger<AlbumsController> logger,
            IOptionsMonitor<AppSettings> options)
            : base(dbSession, logger)
        {
            this.cdnManagerService = cdnManagerService;
            this.songUploadService = songUploadService;

            appOptions = options.CurrentValue;
        }

        /// <summary>
        /// Gets the album with the specified ID.
        /// </summary>
        /// <param name="id"></param>
        [HttpGet]
        public Task<Album> Get(string id)
        {
            return DbSession.LoadAsync<Album>(id);
        }

        [HttpGet]
        public async Task<PagedList<Album>> GetAll(int skip, int take, string search)
        {
            var query = string.IsNullOrWhiteSpace(search) ?
                DbSession.Query<Album>() :
                DbSession.Query<Album>().Where(a => a.Name.StartsWith(search) || a.Artist.StartsWith(search));
            var albums = await query
                .Statistics(out var stats)
                .OrderBy(a => a.Name)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedList<Album>
            {
                Items = albums,
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }

        [HttpGet]
        public async Task<RedirectResult> GetAlbumArtBySongId(string songId)
        {
            var song = await DbSession.LoadRequiredAsync<Song>(songId);
            return Redirect(song.AlbumArtUri.ToString());
        }

        [HttpGet]
        public async Task<Album?> GetByArtistAlbum(string artist, string album)
        {
            var matchingAlbum = await DbSession.Query<Album>()
                .FirstOrNoneAsync(a => a.Name == album && a.Artist == artist);
            if (matchingAlbum == null)
            {
                return await DbSession.Query<Album>()
                    .FirstOrDefaultAsync(a => a.IsVariousArtists && a.Name == album);
            }

            return matchingAlbum;
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<Album> ChangeArt(string albumId, string artUri)
        {
            var album = await DbSession.LoadRequiredAsync<Album>(albumId);
            var albumArtUri = await cdnManagerService.UploadAlbumArtAsync(new Uri(artUri), album.Artist, album.Name, ".jpg");
            album.AlbumArtUri = albumArtUri;

            // Update the songs on this album.
            var songsOnAlbum = await DbSession.Query<Song, Songs_GeneralQuery>()
                .Where(s => s.AlbumId == album.Id)
                .ToListAsync();
            songsOnAlbum.ForEach(s => s.AlbumArtUri = albumArtUri);

            return album;
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<Album> Save([FromBody] Album album)
        {
            if (string.IsNullOrEmpty(album.Artist) || string.IsNullOrEmpty(album.Name))
            {
                throw new ArgumentException("Album must have a name and artist.");
            }

            // Ensure we're not saving a duplicate.
            var isCreatingNew = string.IsNullOrEmpty(album.Id);
            if (isCreatingNew)
            {
                var existingAlbum = await DbSession.Query<Album>()
                    .FirstOrNoneAsync(a => a.Name == album.Name && a.Artist == album.Artist);
                if (existingAlbum != null)
                {
                    throw new ArgumentException($"Attempted to save duplicate album")
                        .WithData("existing album", existingAlbum);
                }
            }

            await DbSession.StoreAsync(album);

            if (!isCreatingNew)
            {
                // Update the album information of all the songs on this album.
                var songsForAlbum = await DbSession.Query<Song>()
                    .Where(s => s.AlbumId == album.Id)
                    .ToListAsync();
                songsForAlbum.ForEach(s => s.UpdateAlbumInfo(album));
                logger.LogInformation("Saving existing album, updated songs' album information.");
            }

            return album;
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<TempFile> UploadTempFile([FromForm] IFormFile file)
        {
            if (file == null)
            {
                throw new ArgumentNullException(nameof(file));
            }

            // See if we have an MP3.
            var contentType = file.ContentType;
            var isMp3 = new[] { "audio/mpeg", "audio/mp3", "audio/mpeg3" }.Any(mp3MimeType => string.Equals(mp3MimeType, contentType, StringComparison.InvariantCultureIgnoreCase));
            var isJpg = new[] { "image/jpeg", "image/jpg" }.Any(jpgMimeType => string.Equals(jpgMimeType, contentType, StringComparison.InvariantCultureIgnoreCase));
            var isPng = string.Equals("image/png", contentType, StringComparison.InvariantCultureIgnoreCase);
            if (!isMp3 && !isJpg && !isPng)
            {
                throw new ArgumentOutOfRangeException(nameof(file), contentType, "Wrong file format. Music files must be in MP3 format. Album art must be in JPG or PNG format.");
            }

            // Make sure it's a reasonable size before we fetch it.
            var maxSize = isMp3 ? 50000000 : 10000000;
            if (file.Length >= maxSize)
            {
                throw new ArgumentOutOfRangeException(nameof(file), file.Length, $"Too large. Max size is {maxSize} bytes");
            }

            // OK, we're cool to upload it to our CDN.
            using var mediaFileStream = file.OpenReadStream();
            var fileExtension = isMp3 ? ".mp3" : isPng ? ".png" : ".jpg";
            var fileName = Guid.NewGuid().ToString() + fileExtension;
            var tempFileUri = await cdnManagerService.UploadTempFileAsync(mediaFileStream, fileName);
            return new TempFile
            {
                Url = tempFileUri,
                Name = fileName,
                Id = fileName
            };
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<string> Upload([FromBody] AlbumUpload album)
        {
            // Put the album art on the CDN with the correct file name containing the album name, artist name, etc.
            // Then Delete the temporary album art file.
            var albumArtUriCdn = await cdnManagerService.UploadAlbumArtAsync(album.AlbumArt.Url, album.Artist, album.Name, System.IO.Path.GetExtension(album.AlbumArt.Id));
            await cdnManagerService.DeleteTempFileAsync(album.AlbumArt.Id);

            // Store the new album if it doesn't exist already.
            var existingAlbum = await DbSession.Query<Album>()
                .FirstOrNoneAsync(a => a.Name == album.Name && a.Artist == album.Artist);
            if (existingAlbum == null)
            {
                existingAlbum = new Album();
            }

            // Store the Artist as well.
            Artist? existingArtist = null;
            if (album.Artist != "Various Artists")
            {
                // Grab the existing artist only if we're not the special case "Various Artists"
                existingArtist = await DbSession.Query<Artist>()
                    .FirstOrDefaultAsync(a => a.Name == album.Artist);
            }

            // Create the artist if necessary.
            if (existingArtist == null)
            {
                existingArtist = new Artist
                {
                    Bio = "",
                    Name = album.Artist,
                    Disambiguation = album.Artist == "Various Artists" ? album.Name : null
                };
                await DbSession.StoreAsync(existingArtist);
            }

            existingAlbum.AlbumArtUri = albumArtUriCdn;
            existingAlbum.Artist = album.Artist;
            existingAlbum.BackgroundColor = album.BackColor;
            existingAlbum.ForegroundColor = album.ForeColor;
            existingAlbum.MutedColor = album.MutedColor;
            existingAlbum.Name = album.Name;
            existingAlbum.HebrewName = album.HebrewName;
            existingAlbum.TextShadowColor = album.TextShadowColor;
            existingAlbum.SongCount = album.Songs.Count + existingAlbum.SongCount;

            if (string.IsNullOrEmpty(existingAlbum.Id))
            {
                await DbSession.StoreAsync(existingAlbum);
            }

            // Store the songs in the DB.
            var songNumber = 1;
            var songsWithTempFiles = new Dictionary<Song, TempFile>(album.Songs.Count);
            foreach (var tempFile in album.Songs)
            {
                var (english, hebrew) = tempFile.Name.GetEnglishAndHebrew();
                var song = new Song
                {
                    Album = album.Name,
                    AlbumHebrewName = album.HebrewName,
                    Artist = album.Artist,
                    AlbumArtUri = albumArtUriCdn,
                    CommunityRankStanding = CommunityRankStanding.Normal,
                    Genres = album.Genres.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).ToList(),
                    Name = english,
                    HebrewName = hebrew,
                    Number = songNumber,
                    PurchaseUri = album.PurchaseUrl,
                    UploadDate = DateTime.UtcNow,
                    AlbumId = existingAlbum.Id,
                    ArtistId = existingArtist.Id,
                    AlbumColors = new AlbumColors
                    {
                        Background = existingAlbum.BackgroundColor,
                        Foreground = existingAlbum.ForegroundColor,
                        Muted = existingAlbum.MutedColor,
                        TextShadow = existingAlbum.TextShadowColor
                    },
                    Uri = tempFile.Url
                };
                await DbSession.StoreAsync(song);

                songsWithTempFiles.Add(song, tempFile);
                songNumber++;
            }

            await DbSession.SaveChangesAsync();

            // Now that the songs are saved in the database, migrate their URIs from temp file to
            // a final file name that includes song, artist, album, etc.
            foreach (var (song, tempFile) in songsWithTempFiles)
            {
                songUploadService.MoveSongUriFromTemporaryToFinal(tempFile, album, song.Number, song.Id!);
            }

            return existingAlbum.Id!;
        }

        [HttpGet]
        public Task<List<Album>> GetAlbums(string albumIdsCsv)
        {
            var max = 20;
            var validIds = albumIdsCsv.Split(new[] { "," }, max, StringSplitOptions.RemoveEmptyEntries)
                .Where(id => id.StartsWith("albums/", StringComparison.InvariantCultureIgnoreCase))
                .Distinct();
            return DbSession.LoadWithoutNulls<Album>(validIds);
        }

        /// <summary>
        /// Streams an image from another domain through our domain.
        /// Needed for client-side canvas rendering of images on other domains (e.g. on our media CDN.)
        /// For example, when upload a new album, we use this URL to draw an image to a canvas in order to extract prominent colors from the album art.
        /// </summary>
        /// <param name="imageUrl"></param>
        /// <returns></returns>
        [HttpGet]
        public async Task<FileContentResult> ImageOnDomain(string imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                throw new ArgumentNullException(nameof(imageUrl));
            }

            using var webClient = new WebClient();
            var bytes = await webClient.DownloadDataTaskAsync(imageUrl);
            return File(bytes, "image/jpeg");
        }

        /// <summary>
        /// Find album art with the specified artist and album name.
        /// </summary>
        /// <param name="songId">The ID of the song we're checking for.</param>
        /// <param name="artist">The artist name.</param>
        /// <param name="album">The album.</param>
        /// <returns>An Album-like object containing the ID of the song.</returns>
        [HttpGet]
        [Route("art/{songId}/{artist}/{album}")]
        public async Task<dynamic> GetAlbumArt(string songId, string artist, string album)
        {
            var existingAlbum = await DbSession
                .Query<Album>()
                .FirstOrDefaultAsync(a => a.Artist == artist && a.Name == album);
            return new
            {
                SongId = songId,
                existingAlbum?.Artist,
                existingAlbum?.Name,
                existingAlbum?.AlbumArtUri
            };
        }

        /// <summary>
        /// Gets the album art for a particular song. Used in the UI by Facebook song share.
        /// </summary>
        /// <param name="songId"></param>
        /// <returns></returns>
        [HttpGet]
        public async Task<HttpResponseMessage> GetArtForSong(string songId)
        {
            var song = await DbSession.LoadRequiredAsync<Song>(songId);
            var response = new HttpResponseMessage(HttpStatusCode.Moved);
            response.Headers.Location = song.AlbumArtUri;
            return response;
        }

        [HttpGet]
        public async Task<List<string>> SongListing(string artist, string album)
        {
            var songs = await DbSession.Query<Song, Songs_GeneralQuery>()
                .Where(s => s.Artist == artist && s.Album == album)
                .ToListAsync();
            return songs
                .Select(s => $"{s.Artist} - {s.Album} - {s.Number} - {s.Name}: {appOptions?.DefaultUrl}/?song={s.Id}")
                .ToList();
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task Delete(string albumId)
        {
            var album = await DbSession.LoadRequiredAsync<Album>(albumId);
            DbSession.Delete(album);

            // Any songs with this album as the album ID should be set to null.
            var songsWithAlbum = await DbSession.Query<Song, Songs_GeneralQuery>()
                .Where(s => s.AlbumId == albumId)
                .ToListAsync();
            songsWithAlbum.ForEach(s => s.AlbumId = "");
        }

        [HttpGet]
        [Authorize]
        public async Task<PagedList<AlbumWithNetLikeCount>> GetLikedAlbums(int skip, int take, string search)
        {
            var userId = GetUserIdOrThrow();
            var query = DbSession.Query<Like, Likes_ByAlbum>()
                .Where(u => u.UserId == userId)
                .ProjectInto<AlbumWithNetLikeCount>()
                .Where(a => a.NetLikeCount > 0)
                .OrderByDescending(a => a.NetLikeCount);

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Search(a => a.Name, search + "*");
            }

            var albums = await query
                .Statistics(out var stats)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedList<AlbumWithNetLikeCount>
            {
                Items = albums,
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }
    }
}
