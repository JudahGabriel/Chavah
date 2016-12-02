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
    [RequireHttps]
    public class HomeController : RavenController
    {
        public HomeController()
        {
            ViewBag.Title = "Chavah Messianic Radio";
            ViewBag.Description = "iternet radio for Yeshua's disciples";
            ViewBag.DescriptiveImageUrl = null;
            ViewBag.QueriedSong = null;
        }

        public async Task<ActionResult> Index()
        {
            var viewModel = new HomeViewModel();
            var currentUser = await this.GetCurrentUser();
            viewModel.UserEmail = currentUser != null ? currentUser.Email : "";
            viewModel.Jwt = currentUser != null ? currentUser.Jwt : "";
            viewModel.UserRoles = currentUser != null ? currentUser.Roles : new List<string>();
            await PopulateViewModelFromQueryString(viewModel);

            // Set a session cookie. We use this to determine who's currently online.
            var cookie = new HttpCookie("SessionId") { Value = Guid.NewGuid().ToString() };
            Response.SetCookie(cookie);
            
            return View(viewModel);
        }

        [Route("home/embed")]
        [Route("durandal/embed")]
        public async Task<ActionResult> Embed()
        {
            var viewModel = new HomeViewModel();
            var currentUser = await this.GetCurrentUser();
            viewModel.UserEmail = currentUser != null ? currentUser.Email : "";
            viewModel.UserRoles = currentUser != null ? currentUser.Roles : new List<string>();
            await PopulateViewModelFromQueryString(viewModel);
            return View("Index", viewModel);
        }

        [Route("account/registeredusers")]
        [HttpGet]
        public async Task<ActionResult> RegisteredUsers()
        {
            var lastRegisteredUsers = await this.DbSession
                .Query<ApplicationUser>()
                .Where(u => u.Email != null)
                .OrderByDescending(a => a.RegistrationDate)
                .Take(100)
                .ToListAsync();
            var feedItems = from user in lastRegisteredUsers
                            select new SyndicationItem(
                                id: user.Id,
                                lastUpdatedTime: user.RegistrationDate,
                                title: user.Email,
                                content: "A new user registered on Chavah on " + user.RegistrationDate.ToString() + " with email address " + user.Email,
                                itemAlternateLink: new Uri("http://messianicradio.com/?user=" + Uri.EscapeUriString(user.Id))
                            );

            var feed = new SyndicationFeed("Chavah Messianic Radio", "The most recent registered users at Chavah Messianic Radio", new Uri("http://messianicradio.com"), feedItems) { Language = "en-US" };
            return new RssActionResult { Feed = feed };
        }

        //[Route("songs/getalbumart")]
        //public async Task<ActionResult> DeprecatedGetAlbumArt(string songId)
        //{
        //    var isOldStyleSongFormat = !songId.StartsWith("songs/", StringComparison.InvariantCultureIgnoreCase);
        //    if (isOldStyleSongFormat)
        //    {
        //        songId = "songs/" + songId;
        //    }

        //    var song = await this.DbSession.LoadAsync<Song>(songId);
        //    return RedirectPermanent(song.AlbumArtUri.ToString());
        //}

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
            var recentActivities = await this.DbSession
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

        /// <summary>
        /// Urls like "http://messianicradio.com?song=songs/32" need to load the server-rendered Razor page with info about that song.
        /// This is used for social media sites like Facebook and Twitter which show images, title, and description from the loaded page.
        /// </summary>
        /// <param name="viewModel"></param>
        /// <returns></returns>
        private async Task PopulateViewModelFromQueryString(HomeViewModel viewModel)
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
                        var album = await this.DbSession.Query<Album>().FirstOrDefaultAsync(a => a.Name == songForQuery.Album && a.Artist == songForQuery.Artist);
                        viewModel.PageTitle = songForQuery.Name + " by " + songForQuery.Artist + " on Chavah Messianic Radio";
                        viewModel.DescriptiveImageUrl = album != null ? album.AlbumArtUri.ToString() : null;
                        viewModel.Song = songForQuery;
                        viewModel.SongNth = songForQuery.Number.ToNumberWord();
                    }
                }
            }
        }

        private async Task<ApplicationUser> GetCurrentUser()
        {
            var userName = User.Identity.Name;
            if (!string.IsNullOrEmpty(userName))
            {
                using (DbSession.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(3)))
                {
                    return await DbSession.LoadAsync<ApplicationUser>("ApplicationUsers/" + userName);
                }
            }

            return null;
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
            
            return await this.DbSession.LoadAsync<Song>(properlyFormattedSongId);
        }

        private async Task<Song> GetMatchingSong(System.Linq.Expressions.Expression<Func<Song, bool>> predicate)
        {
            return await this.DbSession
                .Query<Song>()
                .Customize(x => x.RandomOrdering())
                .Where(predicate)
                .OrderBy(s => s.Id)
                .FirstOrDefaultAsync();
        }
    }
}