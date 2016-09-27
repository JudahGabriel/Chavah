using BitShuva.Common;
using BitShuva.Models;
using Chavah.Common;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel.Syndication;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Xml;

namespace BitShuva.Controllers
{
    public class HomeController : RavenController
    {
        public HomeController()
        {
            ViewBag.Title = "Chavah Messianic Radio";
            ViewBag.Description = "internet radio for Yeshua's disciples";
            ViewBag.DescriptiveImageUrl = null;
            ViewBag.QueriedSong = null;
        }

        public async Task<ActionResult> Index()
        {
            await AppendViewBagQueryStringInfo();

            // Set a session cookie. We use this to determine who's currently online.
            var cookie = new HttpCookie("SessionId") { Value = Guid.NewGuid().ToString()};
            Response.SetCookie(cookie);

            return View();
        }

        //public async Task<ActionResult> Migrate(int skip, int take)
        //{
        //    var songsByArtist = await Session.Query<Song>()
        //        .OrderBy(s => s.Id)
        //        .Skip(skip)
        //        .Take(take)
        //        .ToListAsync();
        //    var urls = new List<Song>();
        //    foreach (var song in songsByArtist)
        //    {
        //        var isOnOldServer = song.Uri.ToString().StartsWith("http://199.204.46.80");
        //        if (isOnOldServer)
        //        {
        //            var escapedSongName = EscapeName(song.Name);
        //            var escapedAlbum = EscapeName(song.Album);
        //            var escapedArtist = EscapeName(song.Artist);
        //            if (song.Number > 0)
        //            {
        //                var songNumberWithZero = song.Number <= 9 ? $"0{song.Number}" : song.Number.ToString();
        //                song.Uri = new Uri($"http://bitshuvafiles01.com/chavah/music/{escapedArtist}/{escapedArtist} - {escapedAlbum} - {songNumberWithZero} - {escapedSongName}.mp3");
        //            }
        //            else
        //            {
        //                song.Uri = new Uri($"http://bitshuvafiles01.com/chavah/music/{escapedArtist}/{escapedArtist} - {escapedAlbum} - {escapedSongName}.mp3");
        //            }

        //            urls.Add(song.ToDto());
        //        }
        //    }

        //    return View(urls);
        //}

        public async Task<ActionResult> GetSongs(string artist)
        {
            var songs = await Session.Query<Song>().Where(s => s.Artist == artist).Take(1000).ToListAsync();
            return View("Migrate", songs);
        }

        class MyClient : System.Net.WebClient
        {
            public bool HeadOnly { get; set; }
            protected override System.Net.WebRequest GetWebRequest(Uri address)
            {
                System.Net.WebRequest req = base.GetWebRequest(address);
                if (HeadOnly && req.Method == "GET")
                {
                    req.Method = "HEAD";
                }
                return req;
            }
        }

        [Route("home/embed")]
        [Route("durandal/embed")]
        public async Task<ActionResult> Embed()
        {
            await AppendViewBagQueryStringInfo();
            ViewBag.EmbeddedClass = "embedded-ui";
            return View("Index");
        }

        [Route("songs/getalbumart")]
        public async Task<ActionResult> DeprecatedGetAlbumArt(string songId)
        {
            var isOldStyleSongFormat = !songId.StartsWith("songs/", StringComparison.InvariantCultureIgnoreCase);
            if (isOldStyleSongFormat)
            {
                songId = "songs/" + songId;
            }

            var song = await this.Session.LoadAsync<Song>(songId);
            return RedirectPermanent(song.AlbumArtUri.ToString());
        }

        public JsonResult GetLatestBlogPost()
        {
            var reader = XmlReader.Create("http://blog.messianicradio.com/feeds/posts/default");
            var feed = SyndicationFeed.Load(reader);
            var item = feed.Items.First();
            var result = new
            {
                Title = item.Title.Text,
                Uri = item.Links.Last().Uri
            };

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        public async Task<ActionResult> ActivityFeed(int take = 5)
        {
            var recentActivities = await this.Session
                .Query<Activity>()
                .OrderByDescending(a => a.DateTime)
                .Take(take)
                .ToListAsync();
            var feedItems = from activity in recentActivities
                            select new SyndicationItem(
                                title: activity.Title,
                                content: activity.Description,
                                itemAlternateLink: activity.MoreInfoUri);

            var feed = new SyndicationFeed("Chavah Messianic Radio", "The latest activity over at Chavah Messianic Radio", new Uri("http://messianicradio.com"), feedItems) { Language = "en-US" };
            return new RssActionResult { Feed = feed };
        }

        private async Task AppendViewBagQueryStringInfo()
        {
            var artistQuery = Request.QueryString["artist"];
            var albumQuery = Request.QueryString["album"];
            var songQuery = Request.QueryString["song"];

            var firstValidQuery = new[] { artistQuery, albumQuery, songQuery }.FirstOrDefault(s => !string.IsNullOrEmpty(s));
            if (firstValidQuery != null)
            {
                var taskOrNull = firstValidQuery == songQuery ? this.GetSongByIdQuery(firstValidQuery) :
                    firstValidQuery == artistQuery ? this.GetSongByArtist(firstValidQuery) :
                    firstValidQuery == albumQuery ? this.GetSongByAlbum(firstValidQuery) :
                    null;

                if (taskOrNull != null)
                {
                    var songForQuery = await taskOrNull;
                    if (songForQuery != null)
                    {
                        var album = await this.Session.Query<Album>().FirstOrDefaultAsync(a => a.Name == songForQuery.Album && a.Artist == songForQuery.Artist);
                        ViewBag.Title = songForQuery.Name + " by " + songForQuery.Artist + " on Chavah Messianic Radio";
                        ViewBag.DescriptiveImageUrl = album != null ? album.AlbumArtUri.ToString() : null;
                        ViewBag.QueriedSong = songForQuery;
                        ViewBag.QueriedSongNth = songForQuery.Number.ToNumberWord();
                    }
                }
            }
        }

        private async Task<Song> GetSongByAlbum(string albumQuery)
        {
            return await GetMatchingSong(s => s.Album == albumQuery);
        }

        private async Task<Song> GetSongByArtist(string artistQuery)
        {
            return await GetMatchingSong(s => s.Artist == artistQuery);
        }

        private async Task<Song> GetSongByIdQuery(string songQuery)
        {
            var properlyFormattedSongId = songQuery.StartsWith("songs/", StringComparison.InvariantCultureIgnoreCase) ?
                songQuery :
                "songs/" + songQuery;
            
            return await this.Session.LoadAsync<Song>(properlyFormattedSongId);
        }

        private async Task<Song> GetMatchingSong(System.Linq.Expressions.Expression<Func<Song, bool>> predicate)
        {
            return await this.Session
                .Query<Song>()
                .Customize(x => x.RandomOrdering())
                .Where(predicate)
                .OrderBy(s => s.Id)
                .FirstOrDefaultAsync();
        }
    }
}