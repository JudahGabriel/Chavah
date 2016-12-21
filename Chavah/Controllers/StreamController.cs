using BitShuva.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Raven.Client;
using System.Text;

namespace BitShuva.Controllers
{
    public class StreamController : RavenController
    {
        /// <summary>
        /// Returns an M3U file. Used for streaming services such as TuneIn radio.
        /// </summary>
        /// <returns></returns>
        public async Task<ActionResult> TuneInV2()
        {
            var songs = await this.DbSession.Query<Song>()
                .Customize(x => x.RandomOrdering())
                .Where(s => s.CommunityRank >= 25)
                .Take(50)
                .ToListAsync();

            await ChavahLog.Info(this.DbSession, "TuneIn radio fetched");

            // Build the M3U file.
            // M3U format is very simple: https://en.wikipedia.org/wiki/M3U
            var m3uBuilder = new StringBuilder();
            m3uBuilder.AppendLine("# EXTM3U"); // The header
            foreach (var song in songs)
            {
                m3uBuilder.AppendLine($"# EXTINF:0, {song.Artist} - {song.Name}");
                m3uBuilder.AppendLine(song.Uri.AbsoluteUri);
            }

            var m3uBytes = Encoding.UTF8.GetBytes(m3uBuilder.ToString());
            return File(m3uBytes, "application/vnd.apple.mpegurl", "ChavahTuneInStream.m3u");
        }
    }
}