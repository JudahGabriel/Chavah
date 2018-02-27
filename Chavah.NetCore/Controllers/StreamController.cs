using BitShuva.Chavah.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Text;
using System;
using System.Collections.Generic;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Common;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using Raven.Client.Documents.Session;
using Raven.Client.Documents.Linq;
using Raven.Client.Documents;

namespace BitShuva.Chavah.Controllers
{
    public class StreamController : RavenController
    {
        public StreamController(
            IAsyncDocumentSession dbSession, 
            ILogger<StreamController> logger)
            : base(dbSession, logger)
        {
        }

        /// <summary>
        /// Returns an M3U file. Used for streaming services such as TuneIn radio.
        /// </summary>
        /// <returns></returns>
        public IActionResult TuneInV2()
        {
            // The M3U file will contain a single URL:
            // The URL to our GetNextSong() action.
            // That method will intelligently pick a song.
            
            // Build the M3U file.
            // M3U format is very simple: https://en.wikipedia.org/wiki/M3U
            var m3uBuilder = new StringBuilder();
            m3uBuilder.AppendLine("# EXTM3U"); // The header

            var getNextSongUrl = this.Url.Action(nameof(GetNextSong), "Stream", null, this.Request.Scheme);
            m3uBuilder.AppendLine(getNextSongUrl);

            var m3uBytes = Encoding.UTF8.GetBytes(m3uBuilder.ToString());
            return File(m3uBytes, "application/vnd.apple.mpegurl", "ChavahTuneInStream.m3u");
        }

        /// <summary>
        /// Returns an M3U file. Used for streaming services such as TuneIn radio.
        /// </summary>
        /// <returns></returns>
        public ActionResult ShabbatMusic() 
        {
            // The M3U file will contain a single URL:
            // The URL to our GetNextSong() action.
            // That method will intelligently pick a song.

            // Build the M3U file.
            // M3U format is very simple: https://en.wikipedia.org/wiki/M3U
            var m3uBuilder = new StringBuilder();
            m3uBuilder.AppendLine("# EXTM3U"); // The header

            var getNextSongUrl = this.Url.Action(nameof(GetNextShabbatSong), "Stream", null, this.Request.Scheme);
            m3uBuilder.AppendLine(getNextSongUrl);

            var m3uBytes = Encoding.UTF8.GetBytes(m3uBuilder.ToString());
            return File(m3uBytes, "application/vnd.apple.mpegurl", "ChavahTuneInStream.m3u");
        }

        public async Task<ActionResult> GetNextShabbatSong()
        {
            var goodShabbatTags = new[]
            {
                "shabbat",
                "peaceful",
                "beautiful",
                "soft",
                "slow",
                "prayer",
                "liturgy",
                "blessing",
                "hymn"
            };
            var song = await DbSession.Query<Song, Songs_GeneralQuery>()
                .Customize(x => x.RandomOrdering())
                .Where(s => s.CommunityRank >= 10 && s.Tags.ContainsAny(goodShabbatTags))
                .FirstOrDefaultAsync();
            return Redirect(song.Uri.ToString());
        }

        public async Task<ActionResult> GetNextSong()
        {
            var userPreferences = new UserSongPreferences();
            var songsWithRanking = default(IList<Songs_RankStandings.Result>);

            // Aggressive caching for the UserSongPreferences and SongsWithRanking. These don't change often.
            using (var cache = DbSession.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(1)))
            {
                // This is NOT an unbounded result set:
                // This queries the Songs_RankStandings index, which will reduce the results. Max number of results will be the number of CommunityRankStanding enum constants.
                songsWithRanking = await this.DbSession.Query<Song, Songs_RankStandings>()
                    .As<Songs_RankStandings.Result>()
                    .ToListAsync();
            }

            var songPick = userPreferences.PickSong(songsWithRanking);
            var song = await DbSession.LoadNotNullAsync<Song>(songPick.SongId);
            return Redirect(song.Uri.ToString());
        }
    }
}