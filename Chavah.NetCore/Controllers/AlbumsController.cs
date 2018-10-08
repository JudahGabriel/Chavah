using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Optional.Async;
using Raven.Client.Documents;
using Raven.Client.Documents.Linq;
using Raven.Client.Documents.Queries;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class AlbumsController : RavenController
    {
        private readonly ICdnManagerService cdnManagerService;
        private readonly ISongUploadService songUploadService;
        private readonly IOptions<AppSettings> options;

        public AlbumsController(
            ICdnManagerService cdnManagerService,
            ISongUploadService songUploadService,
            IAsyncDocumentSession dbSession,
            ILogger<AlbumsController> logger,
            IOptions<AppSettings> options)
            : base(dbSession, logger)
        {
            this.cdnManagerService = cdnManagerService;
            this.songUploadService = songUploadService;
            this.options = options;
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
            IRavenQueryable<Album> query = string.IsNullOrWhiteSpace(search) ?
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
        public async Task<Album> GetByArtistAlbum(string artist, string album)
        {
            var matchingAlbum = await DbSession.Query<Album>()
                .FirstOrNoneAsync(a => a.Name == album && a.Artist == artist);
            if (!matchingAlbum.HasValue)
            {
                return await DbSession.Query<Album>()
                    .FirstOrDefaultAsync(a => a.IsVariousArtists && a.Name == album);
            }

            return matchingAlbum.ValueOr(default(Album));
        }
        
        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<Album> ChangeArt(string albumId, string artUri)
        {
            var album = await DbSession.LoadAsync<Album>(albumId);
            if (album == null)
            {
                throw new ArgumentException("Couldn't find album with ID " + albumId);
            }

            var albumArtUri = await cdnManagerService.UploadAlbumArtAsync(new Uri(artUri), album.Artist, album.Name, ".jpg");
            album.AlbumArtUri = albumArtUri;

            // Update the songs on this album.
            var songsOnAlbum = await this.DbSession.Query<Song, Songs_GeneralQuery>()
                .Where(s => s.Artist == album.Artist && s.Album == album.Name)
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
            if (album.Id?.Length == 0)
            {
                album.Id = null;
            }

            // Are we trying to create a new album? If we already have an album for album name + artist combo, use that one.
            var isCreatingNew = string.IsNullOrEmpty(album.Id);
            if (isCreatingNew)
            {
                var existingAlbum = await DbSession.Query<Album>()
                    .FirstOrNoneAsync(a => a.Name == album.Name && a.Artist == album.Artist);
                existingAlbum
                    .MatchSome(a => throw new ArgumentException($"There's already an album for {a.Artist} - {a.Name}: {a.Id}"));
            }
            
            await DbSession.StoreAsync(album);

            // If we're creating a new album, update the songs that belong to this album.
            if (isCreatingNew)
            {
                var songsForAlbum = await DbSession.Query<Song, Songs_GeneralQuery>()
                    .Where(s => s.AlbumId == null)
                    .Where(album.SongMatchesAlbumNameAndArtistCriteria())
                    .Take(50)
                    .ToListAsync();
                songsForAlbum.ForEach(s => s.AlbumId = album.Id);
            }

            return album;
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<string> Upload([FromBody] AlbumUpload album)
        {
            // Put the album art on the CDN.
            var albumArtUriCdn = await cdnManagerService.UploadAlbumArtAsync(new Uri(album.AlbumArtUri), album.Artist, album.Name, ".jpg");

            // Store the new album if it doesn't exist already.
            var existingAlbum = await DbSession.Query<Album>()
                .FirstOrDefaultAsync(a => a.Name == album.Name && a.Artist == album.Artist);
            if (existingAlbum == null)
            {
                existingAlbum = new Album();
            }

            var existingArtist = await DbSession.Query<Artist>()
                .FirstOrDefaultAsync(a => a.Name == album.Artist);
            if (existingArtist == null)
            {
                existingArtist = new Artist
                {
                    Bio = "",
                    Name = album.Artist
                };
            }

            existingAlbum.AlbumArtUri = albumArtUriCdn;
            existingAlbum.Artist = album.Artist;
            existingAlbum.BackgroundColor = album.BackColor;
            existingAlbum.ForegroundColor = album.ForeColor;
            existingAlbum.MutedColor = album.MutedColor;
            existingAlbum.Name = album.Name;
            existingAlbum.TextShadowColor = album.TextShadowColor;
            existingAlbum.SongCount = album.Songs.Count + existingAlbum.SongCount;

            if (string.IsNullOrEmpty(existingAlbum.Id))
            {
                await this.DbSession.StoreAsync(existingAlbum);
            }

            // Store the songs in the DB.
            var songNumber = 1;
            foreach (var albumSong in album.Songs)
            {
                //var songUriCdn = await CdnManager.UploadMp3ToCdn(albumSong.Address, album.Artist, album.Name, songNumber, albumSong.FileName);
                var songName = albumSong.FileName.GetEnglishAndHebrew();
                var song = new Song
                {
                    Album = album.Name,
                    Artist = album.Artist,
                    AlbumArtUri = albumArtUriCdn,
                    CommunityRankStanding = CommunityRankStanding.Normal,
                    Genres = album.Genres.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).ToList(),
                    Name = songName.english,
                    HebrewName = songName.hebrew,
                    Number = songNumber,
                    PurchaseUri = album.PurchaseUrl,
                    UploadDate = DateTime.UtcNow,
                    Uri = null,
                    AlbumId = existingAlbum.Id,
                    ArtistId = existingArtist.Id
                };
                await this.DbSession.StoreAsync(song);

                // Queue the songs to be uploaded to the CDN.
                songUploadService.QueueMp3Upload(albumSong, album, songNumber, song.Id);
                songNumber++;
            }

            await this.DbSession.SaveChangesAsync();
            return existingAlbum.Id;
        }
        
        [HttpGet]
        public Task<IList<Album>> GetAlbums(string albumIdsCsv)
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
            
            var response = new HttpResponseMessage();
            using (var webClient = new WebClient())
            {
                var bytes = await webClient.DownloadDataTaskAsync(imageUrl);
                return File(bytes, "image/jpeg");
            }
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
            var existingAlbum = await this.DbSession
                .Query<Album>()
                .FirstOrDefaultAsync(a => a.Artist == artist && a.Name == album);
            return new
            {
                SongId = songId,
                existingAlbum?.Artist,
                Name = existingAlbum?.Name,
                existingAlbum?.AlbumArtUri
            };
        }
        
        /// <summary>
        /// Gets the HTTP address for the album art image for the album with the specified name and artist.
        /// </summary>
        /// <param name="artist"></param>
        /// <param name="album"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("art/get")]
        public async Task<HttpResponseMessage> GetAlbumArt(string artist, string album)
        {
            var redirectUri = default(Uri);
            await this.DbSession.Query<Album>()
                .FirstOrNoneAsync(a => a.Artist == artist && a.Name == album)
                .ToAsyncOption()
                .Map(a => a.AlbumArtUri)
                .MatchSome(uri => redirectUri = uri);
            
            if (redirectUri == null)
            {
                // We don't have an album for this. See if we have a matching song.
                await this.DbSession.Query<Song, Songs_GeneralQuery>()
                    .FirstOrNoneAsync(s => s.Album == album && s.Artist == artist)
                    .ToAsyncOption()
                    .Map(s => s.AlbumArtUri)
                    .MatchSome(uri => redirectUri = uri);
                
                if (redirectUri == null)
                {
                    // We can't find album art with this artist and album, nor any song with this album and artist.
                    // See if we have an album by that name.
                    await DbSession.Query<Album>()
                        .FirstOrNoneAsync(a => a.Name == album)
                        .ToAsyncOption()
                        .Map(a => a.AlbumArtUri)
                        .MatchSome(uri => redirectUri = uri);
                }
            }

            if (redirectUri != null)
            {
                var response = new HttpResponseMessage(HttpStatusCode.Moved);
                response.Headers.Location = redirectUri;
                return response;
            }

            this.logger.LogWarning("Unable to find matching album art.", (artist, album));
            return new HttpResponseMessage(HttpStatusCode.NotFound);
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
                .Select(s => $"{s.Artist} - {s.Album} - {s.Number} - {s.Name}: {options?.Value?.Application?.DefaultUrl}/?song={s.Id}")
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
            var userId = this.GetUserIdOrThrow();
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
