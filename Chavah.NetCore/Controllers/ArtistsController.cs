﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class ArtistsController : RavenController
    {
        public ArtistsController(
            IAsyncDocumentSession dbSession,
            ILogger<UsersController> logger)
            : base(dbSession, logger)
        {
        }

        [HttpGet]
        public async Task<Artist> GetByName(string artistName)
        {
            var artist = await DbSession
                .Query<Artist>()
                .FirstOrDefaultAsync(a => a.Name == artistName);
            return artist;
        }

        [HttpGet]
        public async Task<PagedList<Artist>> GetAll(string search, int skip, int take)
        {
            IQueryable<Artist> query = DbSession.Query<Artist>()
                .Statistics(out var stats);
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(a => a.Name.StartsWith(search.ToLower()));
            }
            else
            {
                query = query.OrderBy(a => a.Name);
            }

            var items = await query
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedList<Artist>
            {
                Skip = skip,
                Take = take,
                Items = items,
                Total = stats.TotalResults
            };
        }

        [HttpGet]
        public async Task<dynamic> Rank(string artistName)
        {
            var songsByArtist = await DbSession.Query<Song, Songs_GeneralQuery>()
                .Where(s => s.Artist == artistName)
                .ToListAsync();
            if (songsByArtist.Count == 128)
            {
                var additionalSongs = await DbSession.Query<Song, Songs_GeneralQuery>()
                    .Where(s => s.Artist == artistName)
                    .Skip(128)
                    .ToListAsync();
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

        [HttpGet]
        [Authorize]
        public async Task<PagedList<ArtistWithNetLikeCount>> GetLikedArtists(int skip, int take, string search)
        {
            var userId = GetUserIdOrThrow();
            var query = DbSession.Query<Like, Likes_ByArtist>()
                .Statistics(out var stats)
                .Where(u => u.UserId == userId)
                .ProjectInto<ArtistWithNetLikeCount>()
                .Where(a => a.NetLikeCount > 0)
                .OrderByDescending(a => a.NetLikeCount);

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Search(a => a.Name, search + "*");
            }

            var artists = await query
                .Skip(skip)
                .Take(take)
                .ToListAsync();
            return new PagedList<ArtistWithNetLikeCount>
            {
                Items = artists,
                Skip = skip,
                Take = take,
                Total = stats.TotalResults
            };
        }

        //[Route("save")]
        //[HttpPost]
        //[Authorize(Roles = AppUser.AdminRole)]
        //public async Task<Artist> Save(Artist artist)
        //{
        //    artist.Images = await this.EnsureArtistImagesOnCdn(artist.Name, artist.Images);
        //    if (!string.IsNullOrEmpty(artist.Id))
        //    {
        //        var existingArtist = await DbSession.LoadAsync<Artist>(artist.Id);
        //        existingArtist.Bio = artist.Bio;
        //        existingArtist.Images = artist.Images;
        //        existingArtist.Name = artist.Name;
        //        return existingArtist;
        //    }
        //    else
        //    {
        //        await DbSession.StoreAsync(artist);
        //        return artist;
        //    }
        //}

        //private async Task<List<string>> EnsureArtistImagesOnCdn(string artistName, IList<string> artistImages)
        //{
        //    // Go through each of the images and make sure they're on the CDN.
        //    var cdnHost = cdnManagerService.FtpAddress.Host;
        //    var imageUris = new List<string>();
        //    for (var i = 0; i < artistImages.Count; i++)
        //    {
        //        var image = artistImages[i];
        //        var isOnCdn = image.Contains(cdnManagerService.HttpAlbumArt.ToString(), StringComparison.InvariantCultureIgnoreCase);
        //        if (!isOnCdn)
        //        {
        //            var oneBasedIndex = i + 1;
        //            var fileName = FindUnusedArtistImageFileName(artistName, oneBasedIndex, artistImages);
        //            var newUri = await cdnManagerService.UploadArtistImage(new Uri(image), fileName);
        //            imageUris.Add(newUri.ToString());
        //        }
        //        else
        //        {
        //            imageUris.Add(image);
        //        }
        //    }

        //    return imageUris;
        //}

        //private static string FindUnusedArtistImageFileName(string artist, int index, IList<string> allFileNames)
        //{
        //    const int maxArtistImages = 10000;
        //    var artistCdnSafe = FtpCdnManagerService.GetAlphaNumericEnglish(artist);
        //    while (index < maxArtistImages)
        //    {
        //        var desiredFileName = $"{artistCdnSafe} {index}.jpg";
        //        var isUnique = !allFileNames.Any(f => f.EndsWith(desiredFileName, StringComparison.InvariantCultureIgnoreCase));
        //        if (isUnique)
        //        {
        //            return desiredFileName;
        //        }

        //        index++;
        //    }

        //    throw new InvalidOperationException("Programming bug. Couldn't find a valid artist image name.");
        //}
    }
}
