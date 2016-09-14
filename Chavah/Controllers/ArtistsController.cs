using BitShuva.Models;
using BitShuva.Common;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/artists")]
    public class ArtistsController : UserContextController
    {
        [Route("byname")]
        public async Task<Artist> GetByNameNew(string artistName)
        {
            var artist = await this.DbSession
                .Query<Artist>()
                .FirstOrDefaultAsync(a => a.Name == artistName);
            return artist;
        }

        [Route("all")]
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

        [HttpGet]
        [Route("rank")]
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

        [Route("admin/save")]
        [HttpPost]
        [Authorize]
        public async Task<Artist> Save(Artist artist)
        {
            artist.Images = await this.EnsureArtistImagesOnCdn(artist.Images);
            if (!string.IsNullOrEmpty(artist.Id))
            {
                var existingArtist = await this.DbSession.LoadAsync<Artist>(artist.Id);
                existingArtist.Bio = artist.Bio;
                existingArtist.Images = artist.Images;
                existingArtist.Name = artist.Name;
                return existingArtist;
            }
            else
            {
                await this.DbSession.StoreAsync(artist);
                return artist;
            }
        }


        [HttpDelete]
        [Authorize]
        [Route("admin/delete/{*artistId}")]
        public async Task Delete(string artistId)
        {
            await this.EnsureIsAdminUser();
            var artist = await this.DbSession.LoadAsync<Artist>(artistId);
            if (artist != null)
            {
                this.DbSession.Delete(artist);
            }
        }

        private async Task<List<string>> EnsureArtistImagesOnCdn(IEnumerable<string> artistImages)
        {
            // Go through each of the images and make sure they're on the CDN.
            var cdnHost = CdnManager.cdnAddress.Host;
            var putOnCdnTasks = artistImages.Select(async imageUri =>
            {
                var isOnCdn = imageUri.Contains(cdnHost, StringComparison.InvariantCultureIgnoreCase);
                if (!isOnCdn)
                {
                    var newUri = await CdnManager.UploadArtistImage(new Uri(imageUri));
                    return newUri.ToString();
                }

                return imageUri;
            });

            var imageUris = await Task.WhenAll(putOnCdnTasks.ToArray());
            return new List<string>(imageUris);
        }
    }
}
