using BitShuva.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using Raven.Client;
using Raven.Client.Linq;
using System.Text;
using System;
using System.Collections.Generic;
using BitShuva.Models.Indexes;
using BitShuva.Common;

namespace BitShuva.Controllers
{
    public class StreamController : RavenController
    {
        /// <summary>
        /// Returns an M3U file. Used for streaming services such as TuneIn radio.
        /// </summary>
        /// <returns></returns>
        public ActionResult TuneInV2()
        {
            // The M3U file will contain a single URL:
            // The URL to our GetNextSong() action.
            // That method will intelligently pick a song.
            
            // Build the M3U file.
            // M3U format is very simple: https://en.wikipedia.org/wiki/M3U
            var m3uBuilder = new StringBuilder();
            m3uBuilder.AppendLine("# EXTM3U"); // The header

            var getNextSongUrl = this.Url.Action(nameof(GetNextSong), "Stream", null, this.Request.Url.Scheme);
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

            var getNextSongUrl = this.Url.Action(nameof(GetNextShabbatSong), "Stream", null, this.Request.Url.Scheme);
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
                "prayer",
                "liturgy",
                "instrumental",
                "blessing"
            };
            var song = await DbSession.Query<Song>()
                .Customize(x => x.RandomOrdering())
                .Where(s => s.CommunityRankStanding != CommunityRankStanding.Poor && s.CommunityRankStanding != CommunityRankStanding.VeryPoor && s.Tags.ContainsAny(goodShabbatTags))
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
            var song = await DbSession.LoadNonNull<Song>(songPick.SongId);
            return Redirect(song.Uri.ToString());
        }
    }
}