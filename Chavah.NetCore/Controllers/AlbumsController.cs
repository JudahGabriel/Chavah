using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Services;
using BitShuva.Chavah.Settings;
using BitShuva.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Raven.Client.Documents;
using Raven.Client.Documents.Linq;
using Raven.Client.Documents.Session;

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

        /// <summary>
        /// Gets the list of album submissions.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<List<AlbumSubmissionByArtist>> GetSubmissions()
        {
            return await DbSession.Query<AlbumSubmissionByArtist>()
                .Where(s => s.Status == ApprovalStatus.Pending)
                .Take(100)
                .ToListAsync();
        }

        /// <summary>
        /// Approves an album submission, converting it to a permanent album with songs live on Chavah.
        /// </summary>
        /// <param name="submission"></param>
        /// <returns>The ID of the new album.</returns>
        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<string> ApproveSubmission([FromBody] AlbumSubmissionByArtist submission)
        {
            // Put the album art on the CDN with the correct file name containing the album name, artist name, etc.
            // Then Delete the temporary album art file.
            var albumArtUriCdn = await cdnManagerService.UploadAlbumArtAsync(submission.AlbumArt.Url, submission.Artist, submission.Name, System.IO.Path.GetExtension(submission.AlbumArt.CdnId));
            await cdnManagerService.DeleteTempFileAsync(submission.AlbumArt.CdnId);

            // Store the new album
            var newAlbum = new Album
            {
                AlbumArtUri = albumArtUriCdn,
                Artist = submission.Artist,
                BackgroundColor = submission.BackColor,
                ForegroundColor = submission.ForeColor,
                IsVariousArtists = submission.Artist == "Various Artists",
                MutedColor = submission.MutedColor,
                Name = submission.Name,
                SongCount = submission.Songs.Count,
                TextShadowColor = submission.TextShadowColor,
            };
            await DbSession.StoreAsync(newAlbum);

            // Store the Artist as well if we don't already have an artist for them.
            Artist? existingArtist = null;
            if (submission.Artist != "Various Artists")
            {
                // Grab the existing artist only if we're not the special case "Various Artists"
                existingArtist = await DbSession.Query<Artist>()
                    .FirstOrDefaultAsync(a => a.Name == submission.Artist);
            }

            // Create the artist if necessary.
            if (existingArtist == null)
            {
                existingArtist = new Artist
                {
                    Bio = "",
                    Name = submission.Artist,
                    Contact = submission.ArtistEmail,
                    Disambiguation = submission.Artist == "Various Artists" ? submission.Name : null,
                    DonationUrl = string.IsNullOrWhiteSpace(submission.ArtistPayPalEmail) ? null : new Uri($"paypal:?email={Uri.EscapeDataString(submission.ArtistPayPalEmail)}")
                };
                await DbSession.StoreAsync(existingArtist);
            }

            // Store the songs in the DB.
            var songNumber = 1;
            var songsWithTempFiles = new Dictionary<Song, TempFile>(submission.Songs.Count);
            foreach (var tempFile in submission.Songs)
            {
                var (english, hebrew) = tempFile.Name.GetEnglishAndHebrew();
                var song = new Song
                {
                    Album = submission.Name,
                    AlbumHebrewName = null,
                    Artist = submission.Artist,
                    AlbumArtUri = albumArtUriCdn,
                    CommunityRankStanding = CommunityRankStanding.Normal,
                    ContributingArtists = [.. english.GetFeaturedArtistsFromSongName()],
                    Genres = [],
                    Name = english,
                    HebrewName = hebrew,
                    Number = songNumber,
                    PurchaseUri = submission.PurchaseUrl,
                    UploadDate = DateTime.UtcNow,
                    AlbumId = newAlbum.Id,
                    ArtistId = existingArtist.Id,
                    AlbumColors = new AlbumColors
                    {
                        Background = newAlbum.BackgroundColor,
                        Foreground = newAlbum.ForegroundColor,
                        Muted = newAlbum.MutedColor,
                        TextShadow = newAlbum.TextShadowColor
                    },
                    Uri = tempFile.Url
                };
                await DbSession.StoreAsync(song);

                songsWithTempFiles.Add(song, tempFile);
                songNumber++;
            }

            // Finally, we can mark the submission as approved.
            submission.Status = ApprovalStatus.Approved;
            await DbSession.SaveChangesAsync();

            // Now that the songs are saved in the database, migrate their URIs from temp file to
            // a final file name that includes song, artist, album, etc.ccting 
            foreach (var (song, tempFile) in songsWithTempFiles)
            {
                songUploadService.MoveSongUriFromTemporaryToFinal(tempFile, submission, song.Number, song.Id!);
            }

            return newAlbum.Id!;
        }

        /// <summary>
        /// Rejects an album submission. The album won't be converted to a permanent album on the station. The song uploads and album art upload will be deleted.
        /// </summary>
        /// <param name="submission">The album submission to reject.</param>
        /// <returns></returns>
        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task RejectSubmission([FromBody] AlbumSubmissionByArtist submission)
        {
            var existingSubmission = await DbSession.LoadAsync<AlbumSubmissionByArtist>(submission.Id);
            if (existingSubmission == null)
            {
                throw new ArgumentException($"Could not find album submission with ID {submission.Id}");
            }

            // Mark it as rejected. The submission and its temp files will be deleted at a later date during a background task; see AlbumSubmissionCleanup.cs
            existingSubmission.Status = ApprovalStatus.Rejected;
        }

        [HttpGet]
        public async Task<IActionResult> GetAlbumArtBySongId(string songId)
        {
            if (string.IsNullOrWhiteSpace(songId))
            {
                return BadRequest("songId must not be null or empty");
            }

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
        // [Authorize(Roles = AppUser.AdminRole)] // Commented out: We no longer require admin role for this, because /music/submission page where artists can upload their own music. To prevent abuse, we limit uploads to 100 per day.
        public async Task<TempFile> UploadTempFile([FromForm] IFormFile file)
        {
            if (file == null)
            {
                logger.LogError("Attempted to upload temp file, but no file was provided.");
                throw new ArgumentNullException(nameof(file));
            }

            // See if we have an MP3.
            var contentType = file.ContentType;
            var isMp3 = new[] { "audio/mpeg", "audio/mp3", "audio/mpeg3" }.Any(mp3MimeType => string.Equals(mp3MimeType, contentType, StringComparison.InvariantCultureIgnoreCase));
            var isJpg = new[] { "image/jpeg", "image/jpg" }.Any(jpgMimeType => string.Equals(jpgMimeType, contentType, StringComparison.InvariantCultureIgnoreCase));
            var isPng = string.Equals("image/png", contentType, StringComparison.InvariantCultureIgnoreCase);
            var isWebp = string.Equals("image/webp", contentType, StringComparison.InvariantCultureIgnoreCase);
            if (!isMp3 && !isJpg && !isPng && !isWebp)
            {
                logger.LogError("Attempted to upload temp file with unsupported content type {0}", contentType);
                throw new ArgumentOutOfRangeException(nameof(file), contentType, "Wrong file format. Music files must be in MP3 format. Album art must be in jpg, png, or webp format.");
            }

            // Make sure it's a reasonable size before we fetch it.
            var maxSize = isMp3 ? 50000000 : 10000000;
            if (file.Length >= maxSize)
            {
                logger.LogError("Attempted to upload temp file with size {0} bytes, which exceeds the max size of {1} bytes", file.Length, maxSize);
                throw new ArgumentOutOfRangeException(nameof(file), file.Length, $"Too large. Max size is {maxSize} bytes");
            }

            // To prevent abuse, we limit the number of uploads to 100 per day total.
            var oneDayAgo = DateTimeOffset.UtcNow.AddDays(-1);
            var tempFilesTodayCount = await DbSession.Query<TempFile>()
                .Where(tf => tf.CreatedAt >= oneDayAgo)
                .CountAsync();
            if (tempFilesTodayCount > 100)
            {
                logger.LogError("Tried to upload a temp file, but there have already been {0} in the last day. This is limited to prevent abuse.", tempFilesTodayCount);
                throw new InvalidOperationException($"Cannot upload temp file because there have been too many temp files uploaded recently.");
            }

            // OK, we're cool to upload it to our CDN.
            var fileExtension = isMp3 ? ".mp3" : isPng ? ".png" : isWebp ? ".webp" : ".jpg";
            var fileName = Guid.NewGuid().ToString() + fileExtension;
            try
            {
                using var mediaFileStream = file.OpenReadStream();
                var tempFileUri = await cdnManagerService.UploadTempFileAsync(mediaFileStream, fileName);
                var tempFile = new TempFile
                {
                    Url = tempFileUri,
                    Name = fileName,
                    CdnId = fileName,
                    Id = $"TempFiles/{fileName}/{DateTime.UtcNow:O}",
                    CreatedAt = DateTimeOffset.UtcNow
                };

                await DbSession.StoreAsync(tempFile);
                logger.LogInformation("Successfully uploaded temp file {fileName} to CDN and stored in database with ID {tempFileId}", fileName, tempFile.Id);
                return tempFile;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Uploading temp file {fileName} to CDN failed due to an error.", fileName);
                throw new InvalidOperationException("Error uploading file. Please try again later.");
            }
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<string> Upload([FromBody] AlbumUpload album)
        {
            // Put the album art on the CDN with the correct file name containing the album name, artist name, etc.
            // Then Delete the temporary album art file.
            var albumArtUriCdn = await cdnManagerService.UploadAlbumArtAsync(album.AlbumArt.Url, album.Artist, album.Name, System.IO.Path.GetExtension(album.AlbumArt.CdnId));
            await cdnManagerService.DeleteTempFileAsync(album.AlbumArt.CdnId);

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
                    ContributingArtists = english.GetFeaturedArtistsFromSongName().ToList(),
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

        /// <summary>
        /// Stores an AlbumSubmission object in the database and notifies admins via email that an album submission is waiting for approval.
        /// </summary>
        /// <param name="album">The album being uploaded.</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<string> UploadAlbumSubmissionByArtist([FromBody] AlbumSubmissionByArtist album, [FromServices] IEmailService emailSender, [FromServices] IOptionsMonitor<EmailSettings> emailOptions)
        {
            if (album.AlbumArt == null)
            {
                logger.LogError("Attempted to upload album submission, but no album art was provided.");
                throw new ArgumentException("Album art must not be null.");
            }
            if (album.Songs == null || album.Songs.Count == 0)
            {
                logger.LogError("Attempted to upload album submission, but no songs were provided.");
                throw new ArgumentException("Album upload must have at least one song.");
            }

            // Save it in the database.
            album.Id = $"AlbumSubmissionsByArtist/{album.Artist}/{album.Name}/{DateTime.UtcNow:O}";
            album.Status = ApprovalStatus.Pending;
            album.CreatedAt = DateTimeOffset.UtcNow;
            await DbSession.StoreAsync(album);

            // Notify admins.
            emailSender.QueueAlbumSubmissionEmail(album, GetUserId(), emailOptions.CurrentValue.SenderEmail);

            logger.LogInformation("Successfully saved album submission by artist {artist} for album {album}. Stored in database with ID {id}", album.Artist, album.Name, album.Id);

            return album.Id;
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
