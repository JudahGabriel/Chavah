using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optional.Async;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace BitShuva.Controllers
{
    //[JwtSession]
    [Route("api/albums")]
    public class AlbumsController : RavenApiController
    {
        private readonly ILogger<AlbumsController> logger;
        private readonly ICdnManagerService cdnManagerService;
        private readonly ISongUploadService songUploadService;

        public AlbumsController(ILogger<AlbumsController> logger,
                                ICdnManagerService cdnManagerService,
                                ISongUploadService songUploadService)
        {
            this.logger = logger;
            this.cdnManagerService = cdnManagerService;
            this.songUploadService = songUploadService;
        }

        /// <summary>
        /// Uploads the album art for a song. The album art will be applied to all songs matching the artist and album.
        /// </summary>
        /// <param name="albumArtAddress">The HTTP address where the album art can be fetched. This is expected to be a temporary address created by FilePickr.</param>
        /// <param name="fileName">The file name. Used for extracting the extension.</param>
        /// <param name="artist">The artist this album art applies to.</param>
        /// <param name="album">The name of the album this album art applies to.</param>
        [Route("get")]
        [HttpGet]
        public Task<Album> Get(string id)
        {
            return DbSession.LoadAsync<Album>(id);
        }

        [Route("getAll")]
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

        [Route("GetAlbumArtBySongId")]
        [HttpGet]
        public async Task<HttpResponseMessage> GetBySongId(string songId)
        {
            var song = await DbSession.LoadNotNullAsync<Song>(songId);
            var response = new HttpResponseMessage(HttpStatusCode.Moved);
            response.Headers.Location = song.AlbumArtUri;
            return response;
        }

        [Route("GetByArtistAlbum")]
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
        [Route("changeArt")]
        public async Task<Album> ChangeArt(string albumId, string artUri)
        {
            await this.RequireAdminUser();

            var album = await DbSession.LoadAsync<Album>(albumId);
            if (album == null)
            {
                throw new ArgumentException("Couldn't find album with ID " + albumId);
            }

            var albumArtUri = await cdnManagerService.UploadAlbumArtToCdn(new Uri(artUri), album.Artist, album.Name, ".jpg");
            album.AlbumArtUri = albumArtUri;

            // Update the songs on this album.
            var songsOnAlbum = await this.DbSession.Query<Song, Songs_GeneralQuery>()
                .Where(s => s.Artist == album.Artist && s.Album == album.Name)
                .ToListAsync();
            songsOnAlbum.ForEach(s => s.AlbumArtUri = albumArtUri);

            return album;
        }

        [Route("Save")]
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<Album> Save(Album album)
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
        [Route("upload")]
        [Authorize]
        public async Task<string> Upload(AlbumUpload album)
        {
            // Put the album art on the CDN.
            var albumArtUriCdn = await cdnManagerService.UploadAlbumArtToCdn(new Uri(album.AlbumArtUri), album.Artist, album.Name, ".jpg");

            // Store the new album if it doesn't exist already.
            var existingAlbum = await DbSession.Query<Album>()
                .FirstOrDefaultAsync(a => a.Name == album.Name && a.Artist == album.Artist);
            if (existingAlbum == null)
            {
                existingAlbum = new Album();
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
                    AlbumId = existingAlbum.Id
                };
                await this.DbSession.StoreAsync(song);

                // Queue the songs to be uploaded to the CDN.
                songUploadService.QueueMp3Upload(albumSong, album, songNumber, song.Id);
                songNumber++;
            }

            await this.DbSession.SaveChangesAsync();
            return existingAlbum.Id;
        }

        [Route("getAlbums")]
        [HttpGet]
        public Task<IList<Album>> GetAlbums(string albumIdsCsv)
        {
            var max = 20;
            var validIds = albumIdsCsv.Split(new[] { "," }, max, StringSplitOptions.RemoveEmptyEntries)
                .Where(id => id.StartsWith("albums/", StringComparison.InvariantCultureIgnoreCase))
                .Distinct();
            return DbSession.LoadWithoutNulls<Album>(validIds);
        }

        [Route("GetAlbumsForSongs")]
        [HttpGet]
        [Obsolete("Use GetAlbums instead. Delete this method after 8/3/2017")]
        public async Task<IList<Album>> GetAlbumsForSongs(string songIdsCsv)
        {
            // TODO: we might want to implement a song ID => album ID cache. That would save us a lot of work.

            if (string.IsNullOrEmpty(songIdsCsv))
            {
                throw new ArgumentNullException(nameof(songIdsCsv));
            }

            const int maxAlbumArtFetch = 30;
            var songIds = songIdsCsv.Split(',')
                .Where(s => !string.IsNullOrWhiteSpace(s) && s.StartsWith("songs/", StringComparison.InvariantCultureIgnoreCase)) // Somehow, some users are calling this with ApplicationUsers/[current email].
                .Take(maxAlbumArtFetch);

            var songs = await DbSession
                .Include<Song>(s => s.AlbumId)
                .LoadAsync<Song>(songIds);
            var albums = await DbSession.LoadWithoutNulls<Album>(songs.Select(s => s.AlbumId));
            return albums.ToList();
        }

        /// <summary>
        /// Streams an image from another domain through our domain. 
        /// Needed for client-side canvas rendering of images on other domains (e.g. on our media CDN.)
        /// For example, when upload a new album, we use this URL to draw an image to a canvas in order to extract prominent colors from the album art.
        /// </summary>
        /// <param name="imageUrl"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("art/imageondomain")]
        public async Task<HttpResponseMessage> ImageOnDomain(string imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                throw new ArgumentNullException(nameof(imageUrl));
            }

            var response = new HttpResponseMessage();
            using (var webClient = new WebClient())
            {
                var bytes = await webClient.DownloadDataTaskAsync(imageUrl);
                response.Content = new StreamContent(new MemoryStream(bytes)); // this file stream will be closed by lower layers of web api for you once the response is completed.
                response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
                return response;
            }
        }

        /// <summary>
        /// Find album art with the specified artist and album name.
        /// </summary>
        /// <param name="songId">The ID of the song we're checking for.</param>
        /// <param name="artist">The artist name.</param>
        /// <param name="album">The album.</param>
        /// <returns>An Album-like object containing the ID of the song.</returns>
        [Route("art/{songId}/{artist}/{album}")]
        public async Task<dynamic> GetAlbumArt(string songId, string artist, string album)
        {
            var existingAlbum = await this.DbSession
                .Query<Album>()
                .FirstOrDefaultAsync(a => a.Artist == artist && a.Name == album);
            return new
            {
                SongId = songId,
                Artist = existingAlbum?.Artist,
                Name = existingAlbum?.Name,
                AlbumArtUri = existingAlbum?.AlbumArtUri
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
        [Route("art/forSong")]
        public async Task<HttpResponseMessage> GetArtForSong(string songId)
        {
            var song = await DbSession.LoadNotNullAsync<Song>(songId);
            var response = new HttpResponseMessage(HttpStatusCode.Moved);
            response.Headers.Location = song.AlbumArtUri;
            return response; ;
        }

        [HttpGet]
        [Route("songListing")]
        public async Task<List<string>> SongListing(string artist, string album)
        {
            var songs = await DbSession.Query<Song, Songs_GeneralQuery>()
                .Where(s => s.Artist == artist && s.Album == album)
                .ToListAsync();
            return songs
                .Select(s => $"{s.Artist} - {s.Album} - {s.Number} - {s.Name}: http://messianicradio.com/?song={s.Id}")
                .ToList();
        }
        
        [HttpPost]
        [Route("delete")]
        [Authorize(Roles = "Admin")]
        public async Task Delete(string albumId)
        {
            var album = await DbSession.LoadNotNullAsync<Album>(albumId);
            DbSession.Delete(album);

            // Any songs with this album as the album ID should be set to null.
            var songsWithAlbum = await DbSession.Query<Song, Songs_GeneralQuery>()
                .Where(s => s.AlbumId == albumId)
                .ToListAsync();
            songsWithAlbum.ForEach(s => s.AlbumId = "");
        }
    }
}
