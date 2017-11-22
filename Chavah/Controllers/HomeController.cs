using BitShuva.Common;
using BitShuva.Interfaces;
using BitShuva.Models;
using BitShuva.ViewModels;
using Chavah.Common;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel.Syndication;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Xml;

namespace BitShuva.Controllers
{
    public class HomeController : Controller
    {
        private ILoggerService _logger;
        private ISongService _songService;
        private IAlbumService _albumService;
        private IUserService _userService;

        //TODO: move this to the web.config?\
        private const string _radioUrl = "https://messianicradio.com";
        private const string _blogUrl = @"http://blog.messianicradio.com/feeds/posts/default";

        public HomeController(ILoggerService logger,
                              ISongService songService,
                              IAlbumService albumService,
                              IUserService userService) 
        {
            _songService = songService;
            _logger = logger;
            _albumService = albumService;
            _userService = userService;
        }
        
        /// <summary>
        /// Urls like "http://messianicradio.com?song=songs/32" need to load the server-rendered Razor 
        /// page with info about that song.
        /// This is used for social media sites like Facebook and Twitter which show images, title, 
        /// and description from the loaded page.
        /// In addition it serves Json back for http://messianicradio.com?user=email
        /// </summary>
        /// <param name="user"></param>
        /// <param name="artist"></param>
        /// <param name="album"></param>
        /// <param name="song"></param>
        /// <param name="embed"></param>
        /// <returns></returns>
        [RequireHttps]
        public async Task<ActionResult> Index(string user=null, 
                                              string artist = null,
                                              string album = null,
                                              string song = null,
                                              bool embed = false)
        {
            if (user != null)
            {
                //return user information for the feed.
                var userDb = await _userService.GetUser(user);
                if (userDb == null)
                {
                    RavenDB.AspNet.Identity.IdentityUser
                    return Json(new ApplicationUser(), JsonRequestBehavior.AllowGet);
                }
                else
                {
                    userDb.PasswordHash = "";
                    userDb.SecurityStamp = "";

                    return Json(userDb, JsonRequestBehavior.AllowGet);
                }
            }

            var viewModel = new HomeViewModel
            {
                Embed = embed
            };

            var userName = User.Identity.Name;
            ApplicationUser currentUser = null;
            if (!string.IsNullOrEmpty(userName))
            {
                currentUser = await _userService.GetUser(userName);
            }

            if (currentUser != null)
            {
                viewModel.UserEmail = currentUser.Email;
                viewModel.Jwt = currentUser.Jwt;
                viewModel.UserRoles = currentUser.Roles;
                viewModel.Notifications = currentUser.Notifications;
            }          

            //get the query
            var firstValidQuery = new[] { artist, album, song }.FirstOrDefault(s => !string.IsNullOrEmpty(s));

            if (firstValidQuery != null)
            {
                var taskOrNull = firstValidQuery == song ? _songService.GetSongByIdQueryAsync(firstValidQuery) :
                    firstValidQuery == artist ? _songService.GetSongByArtistAsync(firstValidQuery) :
                    firstValidQuery == album ? _songService.GetSongByAlbumAsync(firstValidQuery) :
                    null;

                if (taskOrNull != null)
                {
                    var songForQuery = await taskOrNull;
                    if (songForQuery != null)
                    {
                        var albumData = await _albumService.GetMatchingAlbumAsync(a => a.Name == songForQuery.Album && a.Artist == songForQuery.Artist);
                        viewModel.PageTitle = $"{songForQuery.Name} by {songForQuery.Artist} on Chavah Messianic Radio";
                        viewModel.DescriptiveImageUrl = albumData?.AlbumArtUri?.ToString();
                        viewModel.Song = songForQuery;
                        viewModel.SongNth = songForQuery.Number.ToNumberWord();
                    }
                }
            }

            return View("Index", viewModel);
        }

        /// <summary>
        /// UI that doesn't require HTTPS. Used for Windows XP and old Android that doesn't support LetsEncrypt certs.
        /// </summary>
        /// <returns></returns>
        public async Task<ActionResult> Legacy(string user = null,
                                               string artist = null,
                                               string album = null,
                                               string song = null)
        {
            //log the User Agent
            await _logger.Info("Loaded non-HTTPS Chavah via /home/legacy", Request.UserAgent);
            //return the default HomeViewModel
            return await Index(user, artist, album, song);
        }

        [Route("home/embed")]
        public async Task<ActionResult> Embed(string user = null,
                              string artist = null,
                              string album = null,
                              string song = null)
        {
            return await Index(user, artist, album, song, true);
        }

        /// <summary>
        /// site.com/about
        /// </summary>
        /// <returns></returns>
        [Route("about")]
        public ActionResult About()
        {
            return View();
        }

        [Route("GetLatestBlogPost")]
        public JsonResult GetLatestBlogPost()
        {
            var reader = XmlReader.Create(_blogUrl);
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
            var recentActivities = await _logger.GetActivity(take);

            var feedItems = from activity in recentActivities
                            select new SyndicationItem(
                                title: activity.Title,
                                content: activity.Description,
                                itemAlternateLink: activity.MoreInfoUri);

            var feed = new SyndicationFeed("Chavah Messianic Radio",
                                           "The latest activity over at Chavah Messianic Radio",
                                           new Uri(_radioUrl), feedItems)
            { Language = "en-US" };
            return new RssActionResult { Feed = feed };
        }

    }
}