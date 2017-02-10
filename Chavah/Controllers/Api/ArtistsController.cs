using BitShuva.Models;
using BitShuva.Common;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;

namespace BitShuva.Controllers
{
    [JwtSession]
    [RoutePrefix("api/artists")]
    public class ArtistsController : RavenApiController
    {
        [Route("getByName")]
        [AllowAnonymous]
        public async Task<Artist> GetByName(string artistName)
        {
            var artist = await this.DbSession
                .Query<Artist>()
                .FirstOrDefaultAsync(a => a.Name == artistName);
            return artist;
        }

        [Route("all")]
        [AllowAnonymous]
        public async Task<PagedList<Artist>> GetAll(string search, int skip, int take)
        {
            var stats = default(RavenQueryStatistics);
            var query = this.DbSession.Query<Artist>().Statistics(out stats);
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(a => a.Name.StartsWith(search.ToLower()));
            }
            else
            {
                query = query.OrderBy(a => a.Name);
            }

            var items = await query.Skip(skip).Take(take).ToListAsync();
            return new PagedList<Artist>
            {
                Skip = skip,
                Take = take,
                Items = items,
                Total = stats.TotalResults
            };
        }

        [Route("rank")]
        [HttpGet]
        [AllowAnonymous]
        public async Task<dynamic> Rank(string artistName)
        {
            var songsByArtist = await this.DbSession.Query<Song>().Where(s => s.Artist == artistName).ToListAsync();
            if (songsByArtist.Count == 128)
            {
                var additionalSongs = await this.DbSession.Query<Song>().Where(s => s.Artist == artistName).Skip(128).ToListAsync();
                additionalSongs.ForEach(s => songsByArtist.Add(s));
            }

            var orderedByRank = songsByArtist.OrderByDescending(s => s.CommunityRank);
            return new
            {
                SongCount = songsByArtist.Count,
                AverageRank = Math.Round(songsByArtist.Average(s => s.CommunityRank)),
                Best = orderedByRank.First().Name + " at " + orderedByRank.First().CommunityRank.ToString(),
                Worst = orderedByRank.Last().Name + " at " + orderedByRank.Last().CommunityRank.ToString()
            };
        }

        [Route("save")]
        [HttpPost]
        //[Authorize] TODO: authorize this
        public async Task<Artist> Save(Artist artist)
        {
            artist.Images = await this.EnsureArtistImagesOnCdn(artist.Name, artist.Images);
            if (!string.IsNullOrEmpty(artist.Id))
            {
                var existingArtist = await DbSession.LoadAsync<Artist>(artist.Id);
                existingArtist.Bio = artist.Bio;
                existingArtist.Images = artist.Images;
                existingArtist.Name = artist.Name;
                return existingArtist;
            }
            else
            {
                await DbSession.StoreAsync(artist);
                return artist;
            }
        }


        [Route("admin/delete/{*artistId}")]
        [HttpDelete]
        [Authorize]
        public async Task Delete(string artistId)
        {
            await this.RequireAdminUser();

            var artist = await this.DbSession.LoadAsync<Artist>(artistId);
            if (artist != null)
            {
                this.DbSession.Delete(artist);
            }
        }

        #region Private
        private async Task<List<string>> EnsureArtistImagesOnCdn(string artistName, IList<string> artistImages)
        {
            // Go through each of the images and make sure they're on the CDN.
            var cdnHost = CdnManager.cdnAddress.Host;
            var imageUris = new List<string>();
            for (var i = 0; i < artistImages.Count; i++)
            {
                var image = artistImages[i];
                var isOnCdn = image.Contains(CdnManager.artistImagesUri.ToString(), StringComparison.InvariantCultureIgnoreCase);
                if (!isOnCdn)
                {
                    var oneBasedIndex = i + 1;
                    var fileName = FindUnusedArtistImageFileName(artistName, oneBasedIndex, artistImages);
                    var newUri = await CdnManager.UploadArtistImage(new Uri(image), fileName);
                    imageUris.Add(newUri.ToString());
                }
                else
                {
                    imageUris.Add(image);
                }
            }

            return imageUris;
        }

        static string FindUnusedArtistImageFileName(string artist, int index, IList<string> allFileNames)
        {
            const int maxArtistImages = 10000;
            var artistCdnSafe = CdnManager.GetAlphaNumericEnglish(artist);
            while (index < maxArtistImages)
            {
                var desiredFileName = $"{artistCdnSafe} {index}.jpg";
                var isUnique = !allFileNames.Any(f => f.EndsWith(desiredFileName, StringComparison.InvariantCultureIgnoreCase));
                if (isUnique)
                {
                    return desiredFileName;
                }

                index++;
            }

            throw new InvalidOperationException("Programming bug. Couldn't find a valid artist image name.");
        }
        #endregion
    }
}
