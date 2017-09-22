using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Rss;
using BitShuva.Chavah.Services;
using Chavah.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.SyndicationFeed;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;

namespace BitShuva.Chavah.Controllers
{
    //[Route("[controller]/[action]")]
    public class HomeController : RavenController
    {
        private ISongService _songService;
        private IAlbumService _albumService;
        private IUserService _userService;

        //TODO: move this to the web.config?\
        private const string _radioUrl = "https://messianicradio.com";
        private const string _blogUrl = @"http://blog.messianicradio.com/feeds/posts/default";

        public HomeController(IAsyncDocumentSession dbSession,
                                ILogger<HomeController> logger,
                                ISongService songService,
                                IAlbumService albumService,
                                IUserService userService) 
                                : base(dbSession, logger)
        {
            _songService = songService;
            _albumService = albumService;
            _userService = userService;
        }
        
        /// <summary>
        /// Urls like "http://messianicradio.com?song=songs/32" need to load the server-rendered Razor 
        /// page with info about that song.
        /// This is used for social media sites like Facebook and Twitter which show images, title, 
        /// and description from the loaded page.
        /// </summary>
        /// <param name="user"></param>
        /// <param name="artist"></param>
        /// <param name="album"></param>
        /// <param name="song"></param>
        /// <param name="embed"></param>
        /// <returns></returns>
        [RequireHttps]
        [HttpGet]
        [Route("")]
        public async Task<IActionResult> Index(string user=null, 
                                               string artist = null,
                                               string album = null,
                                               string song = null,
                                               bool embed = false)
        {
            var viewModel = new HomeViewModel
            {
                Embed = embed
            };

            var userName = User.Identity.Name;
            AppUser currentUser = null;
            if (!string.IsNullOrEmpty(userName))
            {
                currentUser = await _userService.GetUser(userName);
            }

            if (currentUser != null)
            {
                viewModel.UserEmail = currentUser.Email;
                //viewModel.Jwt = currentUser.Jwt;
                viewModel.UserRoles = new List<string>(currentUser.Roles);
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
        [HttpGet]
        public Task<IActionResult> Legacy(string user = null,
                                               string artist = null,
                                               string album = null,
                                               string song = null)
        {
            //log the User Agent
            Request.Headers.TryGetValue("User-Agent", out var userAgent);
            logger.LogInformation("Loaded non-HTTPS Chavah via /home/legacy. {userAgent}", userAgent.ToString() ?? string.Empty);
            return Index(user, artist, album, song);
        }

        [HttpGet]
        public Task<IActionResult> Embed(string user = null,
                              string artist = null,
                              string album = null,
                              string song = null)
        {
            return Index(user, artist, album, song, true);
        }
        
        [HttpGet]
        public ActionResult About()
        {
            return View();
        }

        // TODO: port this to AspNetCore
        //public async Task<ActionResult> ActivityFeed(int take = 5)
        //{
        //    var recentActivities = await _logger.GetActivity(take);

        //    var feedItems = from activity in recentActivities
        //                    select new SyndicationItem(
        //                        title: activity.Title,
        //                        content: activity.Description,
        //                        itemAlternateLink: activity.MoreInfoUri);

        //    var feed = new SyndicationFeed("Chavah Messianic Radio",
        //                                   "The latest activity over at Chavah Messianic Radio",
        //                                   new Uri(_radioUrl), feedItems)
        //    { Language = "en-US" };
        //    return new RssActionResult(feed);
        //}

    }
}