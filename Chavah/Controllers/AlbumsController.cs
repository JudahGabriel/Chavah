using BitShuva.Common;
using BitShuva.Models;
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
using System.Web.Http;

namespace BitShuva.Controllers
{
    [ParseJwtSession]
    [RoutePrefix("api/albums")]
    public class AlbumsController : RavenApiController
    {
        /// <summary>
        /// Uploads the album art for a song. The album art will be applied to all songs matching the artist and album.
        /// </summary>
        /// <param name="address">The HTTP address where the album art can be fetched. This is expected to be a temporary address created by FilePickr.</param>
        /// <param name="fileName">The file name. Used for extracting the extension.</param>
        /// <param name="artist">The artist this album art applies to.</param>
        /// <param name="album">The name of the album this album art applies to.</param>
        [HttpPost]
        [Route("uploadArt")]
        public async Task<Album> UploadAlbumArt(string address, string fileName, string artist, string album)
        {
            await this.RequireAdminUser();

            var downloader = new System.Net.WebClient();
            var unescapedFileName = Uri.UnescapeDataString(artist) + " - " + Uri.UnescapeDataString(album) + Path.GetExtension(fileName);

            var albumArtUri = await CdnManager.UploadAlbumArtToCdn(new Uri(address), artist, album, Path.GetExtension(fileName));
            var existingAlbum = await this.DbSession
                .Query<Album>()
                .FirstOrDefaultAsync(a => a.Artist == artist && a.Name == album);
            if (existingAlbum != null)
            {
                existingAlbum.AlbumArtUri = albumArtUri;
            }
            else
            {
                existingAlbum = new Album
                {
                    Name = album,
                    Artist = artist,
                    AlbumArtUri = albumArtUri
                };
                await this.DbSession.StoreAsync(existingAlbum);
            }

            // Update the songs on this album.
            var songsOnAlbum = await this.DbSession
                .Query<Song>()
                .Where(s => s.Artist == artist && s.Album == album)
                .ToListAsync();
            songsOnAlbum.ForEach(s => s.AlbumArtUri = albumArtUri);

            return existingAlbum;
        }

        [Route("Get")]
        [HttpGet]
        public Task<Album> Get(string id)
        {
            return DbSession.LoadAsync<Album>(id);
        }

        [Route("Save")]
        [HttpPost]
        public async Task<Album> Save(Album album)
        {
            await RequireAdminUser();
            await DbSession.StoreAsync(album);
            return album;
        }

        [Route("GetAlbumsForSongs")]
        [HttpGet]
        public async Task<IList<Album>> GetAlbumsForSongs(string songIdsCsv)
        {
            const int maxAlbumArtFetch = 15;
            var songIds = songIdsCsv.Split(',').Take(maxAlbumArtFetch);
            var songs = await DbSession.LoadAsync<Song>(songIds);
            var albumNames = songs
                .Where(s => s != null && !string.IsNullOrEmpty(s.Album))
                .Select(s => s.Album)
                .ToList();
            var albums = await DbSession.Query<Album>()
                .Where(a => a.Name.In(albumNames))
                .ToListAsync();
            return albums;
        }

        [Route("NullColors")]
        [HttpGet]
        public async Task<Album> GetAlbumWithNullColors()
        {
            var album = await DbSession.Query<Album>()
                .Customize(x => x.RandomOrdering())
                .FirstOrDefaultAsync(a => a.BackgroundColor == null);
            return album;
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
        
        [HttpPost]
        [Route("upload")]
        public async Task<string> Upload(AlbumUpload album)
        {
            await this.RequireAdminUser();

            // Put the album art on the CDN.
            var albumArtUriCdn = await CdnManager.UploadAlbumArtToCdn(new Uri(album.AlbumArtUri), album.Artist, album.Name, ".jpg");

            // Put all the songs on the CDN.
            var songNumber = 1;
            foreach (var albumSong in album.Songs)
            {
                var songUriCdn = await CdnManager.UploadMp3ToCdn(albumSong.Address, album.Artist, album.Name, albumSong.FileName);
                var song = new Song
                {
                    Album = album.Name,
                    Artist = album.Artist,
                    AlbumArtUri = albumArtUriCdn,
                    CommunityRankStanding = CommunityRankStanding.Normal,
                    Genres = album.Genres.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).ToList(),
                    Name = albumSong.FileName,
                    Number = songNumber,
                    PurchaseUri = album.PurchaseUrl,
                    UploadDate = DateTime.UtcNow,
                    Uri = songUriCdn
                };
                await this.DbSession.StoreAsync(song);
                songNumber++;
            }

            // Store the new album if it doesn't exist already.
            var existingAlbum = await DbSession.Query<Album>()
                .FirstOrDefaultAsync(a => a.Artist == album.Artist && a.Name == album.Name);
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

            if (string.IsNullOrEmpty(existingAlbum.Id))
            {
                await this.DbSession.StoreAsync(existingAlbum);
            }

            await this.DbSession.SaveChangesAsync();
            return existingAlbum.Id;
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
            var existingAlbum = await this.DbSession.Query<Album>()
                .FirstOrDefaultAsync(a => a.Artist == artist && a.Name == album);
            if (existingAlbum != null && existingAlbum.AlbumArtUri != null)
            {
                redirectUri = existingAlbum.AlbumArtUri;
            }
            else
            {
                // We don't have an album for this. See if we have a matching song.
                var matchingSong = await this.DbSession.Query<Song>().FirstOrDefaultAsync(s => s.Album == album && s.Artist == artist);
                if (matchingSong != null && matchingSong.AlbumArtUri != null)
                {
                    redirectUri = matchingSong.AlbumArtUri;
                }
            }

            if (redirectUri != null)
            {
                var response = Request.CreateResponse(HttpStatusCode.Moved);
                response.Headers.Location = redirectUri;
                return response;
            }

            throw new Exception("Unable to find any matching album art for " + artist + " - " + album);
        }

        [HttpGet]
        [Route("songlisting")]
        public async Task<List<string>> SongListing(string artist, string album)
        {
            var songs = await DbSession.Query<Song>()
                .Where(s => s.Artist == artist && s.Album == album)
                .ToListAsync();
            return songs
                .Select(s => $"{s.Artist} - {s.Album} - {s.Number} - {s.Name}: http://messianicradio.com/?song={s.Id}")
                .ToList();
        }
    }
}
