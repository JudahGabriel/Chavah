using System.Threading.Tasks;

using AutoMapper;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;
using BitShuva.Chavah.Services;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Raven.Client.Documents.Session;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace BitShuva.Chavah.Controllers
{
    [RequireHttps]
    public class HomeController : RavenController
    {
        private readonly ISongService songService;
        private readonly IMapper mapper;
        private readonly AppSettings appOptions;
        private readonly IWebHostEnvironment host;
        private readonly CdnSettings cdnOptions;

        public HomeController(
            ISongService songService,
            IOptions<AppSettings> appOptions,
            IOptions<CdnSettings> cdnOptions,
            IWebHostEnvironment host,
            IMapper mapper,
            IAsyncDocumentSession dbSession,
            ILogger<HomeController> logger)
            : base(dbSession, logger)
        {
            this.songService = songService;
            this.mapper = mapper;
            this.host = host;
            this.appOptions = appOptions.Value;
            this.cdnOptions = cdnOptions.Value;
        }

        /// <summary>
        /// Urls like "https://messianicradio.com?song=songs/32" need to load the server-rendered Razor
        /// page with info about that song.
        /// This is used for social media sites like Facebook and Twitter which show images, title,
        /// and description from the loaded page before any JS is executed.
        /// </summary>
        [HttpGet]
        [Route("")]
        public async Task<IActionResult> Index(string? artist = null, string? album = null, string? song = null, bool embed = false)
        {
            // Development? Return our simple dev-index.html file.
            if (this.host.IsDevelopment())
            {
                return File("/dev-index.html", "text/html");
            }

            
            var user = await GetUser();
            var userVm = user != null ? _mapper.Map<UserViewModel>(user) : null;
            var loadedSong = await GetSongFromQuery(artist, album, song);
            var homeViewModel = HomeViewModel.From(userVm, loadedSong, _appOptions, _cdnOptions);
            homeViewModel.Embed = embed;
            homeViewModel.CacheBustedAngularViews = _ngViews.Views;

            // TODO
            //homeViewModel.Redirect =

            return View("Index", homeViewModel);
        }

        private async Task<Song?> GetSongFromQuery(string? artist, string? album, string? songId)
        {
            if (!string.IsNullOrEmpty(songId))
            {
                return await _songService.GetSongByIdQueryAsync(songId);
            }

            // Both artist and album specified? Load one of those.
            if (!string.IsNullOrEmpty(artist)
                && !string.IsNullOrEmpty(album))
            {
                return await _songService.GetMatchingSongAsync(s => s.Artist == artist && s.Album == album);
            }

            if (!string.IsNullOrEmpty(artist))
            {
                return await _songService.GetSongByArtistAsync(artist);
            }

            if (!string.IsNullOrEmpty(album))
            {
                return await _songService.GetSongByAlbumAsync(album);
            }

            return null;
        }

        [HttpGet]
        [Route("home/embed")]
        public Task<IActionResult> Embed(string? artist = null, string? album = null, string? song = null)
        {
            return Index(artist, album, song, true);
        }

        [HttpGet]
        [Route("give")]
        public IActionResult Give()
        {
            return Redirect("https://blog.messianicradio.com/2020/06/announcing-messiahs-musicians-fund-we.html");
        }

        [HttpGet]
        public IActionResult ActivityFeed()
        {
            return RedirectToActionPermanent("ActivityFeed", "Activities");
        }

        /// <summary>
        /// Implements the upcoming web standard that helps password managers change a user's password.
        /// </summary>
        /// <remarks>
        /// https://github.com/WICG/change-password-url/blob/gh-pages/explainer.md
        /// </remarks>
        /// <returns></returns>
        [HttpGet]
        [Route(".well-known/change-password")]
        public IActionResult ChangePassword()
        {
            return Redirect("/#/forgotpassword");
        }

        /// <summary>
        /// Digital asset links for use in Chavah Android app. See https://developers.google.com/digital-asset-links/v1/getting-started#quick-usage-example
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route(".well-known/assetlinks.json")]
        public JsonResult AssetLinks()
        {
            var assetLinks = new
            {
                relation = new[] { "delegate_permission/common.handle_all_urls" },
                target = new
                {
                    @namespace = "android_app",
                    package_name = "com.messianicradio",
                    sha256_cert_fingerprints = new[]
                    {
                        "4B:C1:D7:C7:8D:74:21:56:8C:E0:13:00:12:35:19:94:4B:33:1E:3C:2B:E5:7A:04:04:FE:F9:3E:58:30:B0:F4",
                        "62:BF:25:D6:5B:C9:E8:2F:CE:3B:BB:77:F7:F0:D1:DF:E9:BB:53:11:68:E9:22:31:01:AE:B4:ED:5F:86:7B:FD"
                    }
                }
            };

            return Json(new[] { assetLinks });
        }

        /// <summary>
        /// Provides URI handling and navigator.getInstalledRelatedApps() support for our Windows app. See https://web.dev/get-installed-related-apps/#tell-your-windows-app-about-your-website
        /// </summary>
        [HttpGet]
        [Route(".well-known/windows-app-web-link")]
        public JsonResult WindowsAppWebLink()
        {
            var appLink = new
            {
                packageFamilyName = "42541BitShuva.ChavahMessianicRadio_y3m7a4hh6j3hy",
                paths = new string[] { "*" }
            };

            return Json(new[] { appLink });
        }
    }
}
