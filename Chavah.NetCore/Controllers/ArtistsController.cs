using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Raven.Client.Documents;
using Raven.Client.Documents.Queries;
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
                .Take(1000)
                .ToListAsync();

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

        /// <summary>
        /// Calculates the donation distributions for artists on Chavah for the given time period, given the specified donations.
        /// </summary>
        /// <param name="year">The year of the time period to calculate donations for.</param>
        /// <param name="month">The month number (1 through 12) of the time period to calculate donatiosn for.</param>
        /// <param name="donations">The total amount of donations in dollars, e.g. 310.52</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<IEnumerable<MessiahMusicFundRecord>> GetMessiahsMusicFundDistribution(int year, int month, decimal donations)
        {
            var playsCounterName = $"Plays-{year}-{month}";
            var rawResults = await DbSession.Query<Artist>()
                .Select(a => new MessiahMusicFundRecord
                {
                    ArtistId = a.Id,
                    DonationRecipientId = a.DonationRecipientId,
                    ArtistName = !string.IsNullOrEmpty(a.Disambiguation) ? $"{a.Name} ({a.Disambiguation})" : a.Name,
                    Plays = RavenQuery.Counter(a, playsCounterName) ?? 0
                }).ToListAsync();

            var totalPlays = rawResults.Sum(a => a.Plays);
            if (totalPlays == 0 || !rawResults.Any())
            {
                return new List<MessiahMusicFundRecord>();
            }

            // Counters are not queryable. We must do this query and ordering in memory.
            return rawResults
                .Where(a => a.Plays > 0)
                .OrderByDescending(a => a.Plays)
                .Select(a => new MessiahMusicFundRecord
                {
                    ArtistId = a.ArtistId,
                    ArtistName = a.ArtistName,
                    DonationRecipientId = a.DonationRecipientId,
                    Plays = a.Plays,
                    PlayPercentage = (a.Plays / (double)totalPlays),
                    Disbursement = Math.Round((a.Plays / (decimal)totalPlays) * donations, 2)
                });
        }

        /// <summary>
        /// Records Messiah's Music Fund disbursment donations to artists for the specified month and year.
        /// This is idempotent; calling this multiple times for the same month and year will simply replace the existing Messiah's Music Fund disbursement for that month and year.
        /// After this method is called, every artist will have a new donation in its .Donations.
        /// </summary>
        /// <param name="year">The year for which to record disbursement.</param>
        /// <param name="month">The month for which to record disbursement.</param>
        /// <param name="donations">The total amount of donations, in dollars, for the month.</param>
        /// <returns></returns>
        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task RecordMessiahsMusicFundMonthlyDisbursement(int year, int month, decimal donations)
        {
            // Get the expected disbursement records for each artist.
            var disbursementRecords = await GetMessiahsMusicFundDistribution(year, month, donations);
            var donationsToMake = disbursementRecords
                .Select(a => new
                {
                    a.ArtistId,
                    Amount = a.Disbursement
                })
                .ToList();

            // Load the artists that we need to donate to.
            var donorRecipientIds = disbursementRecords
                .Select(i => i.ArtistId ?? string.Empty);
            var artists = await DbSession.LoadOptionalAsync<Artist>(donorRecipientIds);
            foreach (var donation in donationsToMake)
            {
                // Find a matching artist.
                var artist = artists.FirstOrDefault(a => a != null && a.Id == donation.ArtistId);
                if (artist == null)
                {
                    logger.LogWarning("Recording Messiah's Music Fund Disbursement, unable to find artist with {id}", donation.ArtistId);
                }
                else
                {
                    // Record the Messiah's Music Fund donation for this month.
                    var donationRecord = Donation.CreateMessiahsMusicFundDonation(year, month, donation.Amount);

                    // Remove any existing Messiah's Music Fund donation for this year/month/artist combo
                    // as there should only be 1 monthly donation from Messiah's Music Fund for this artist.
                    artist.Donations.RemoveAll(d => d.Date == donationRecord.Date && d.DonorName == donationRecord.DonorName);
                    artist.Donations.Add(donationRecord);
                }
            }
        }

        /// <summary>
        /// Sums up artist donations that haven't yet been disbursed and are greater than the specified minimum.
        /// </summary>
        /// <param name="minimum">The minimum amount in dollars to consider a donation due.</param>
        /// <returns></returns>
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<IEnumerable<DueDonation>> GetDueDonations(double minimum)
        {
            var artists = new List<Artist>(1000);
            await foreach (var artist in DbSession.Advanced.Stream<Artist>())
            {
                artists.Add(artist);
            }

            return artists
                .GroupBy(a => a.DonationRecipientId?.ToLowerInvariant() ?? a.Id?.ToLowerInvariant() ?? "") // Some donations for an artist go towards another artist. Group those together.
                .Select(artistGroup => new // Create a new object containing the donation recipient and all the donations
                {
                    Artist = artistGroup.FirstOrDefault(a => string.Equals(a.Id, artistGroup.Key, StringComparison.OrdinalIgnoreCase)) ?? artistGroup.First(),
                    Donations = artistGroup
                        .SelectMany(a => a.Donations.Select(donation => DonationContext.FromDonation(donation, a.GetNameWithDisambiguation(), a.Id ?? string.Empty))) // Combine all the donations for this artist group
                        .Where(d => d.DistributionDate == null) // Get the ones we haven't yet distributed.
                        .ToList()
                })
                .Select(a => new DueDonation
                {
                    Amount = Math.Round(a.Donations.Sum(d => d.Amount), 2),
                    ArtistId = a.Artist.Id!,
                    Donations = a.Donations,
                    DonationUrl = a.Artist.DonationUrl,
                    Name = a.Artist.Name
                })
                .Where(a => a.Amount >= minimum)
                .OrderByDescending(a => a.Amount);
        }

        /// <summary>
        /// Marks the donation as paid.
        /// </summary>
        /// <param name="donation"></param>
        /// <returns></returns>
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<DueDonation> MarkDueDonationAsPaid([FromBody]DueDonation dueDonation)
        {
            var unpaidDonations = dueDonation.Donations.Where(d => d.DistributionDate == null);
            var artistIds = unpaidDonations
                .Select(d => d.ArtistId)
                .Distinct();
            var artists = await DbSession.LoadWithoutNulls<Artist>(artistIds);
            foreach (var donation in unpaidDonations)
            {
                donation.DistributionDate = DateTime.UtcNow;

                // Save it in the database.
                var artist = await DbSession.LoadRequiredAsync<Artist>(donation.ArtistId);
                var matchingDonation = artist.Donations.Single(d => d.Date == donation.Date && d.Amount == donation.Amount && d.DonorName == donation.DonorName && d.DistributionDate == null);
                matchingDonation.DistributionDate = donation.DistributionDate;
            }

            return dueDonation;
        }
    }
}
