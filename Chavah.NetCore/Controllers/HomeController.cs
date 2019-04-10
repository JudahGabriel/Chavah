using System.Threading.Tasks;

using AutoMapper;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Options;
using BitShuva.Chavah.Services;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [RequireHttps]
    public class HomeController : RavenController
    {
        private readonly ISongService _songService;
        private readonly AngularCacheBustedViews _ngViews;
        private readonly ApplicationOptions _appOptions;
        private readonly IMapper _mapper;
        private readonly CdnOptions _cdnOptions;

        public HomeController(
            ISongService songService,
            AngularCacheBustedViews ngViews,
            IOptionsMonitor<ApplicationOptions> appOptions,
            IOptionsMonitor<CdnOptions> cdnOptions,
            IMapper mapper,
            IAsyncDocumentSession dbSession,
            ILogger<HomeController> logger)
            : base(dbSession, logger)
        {
            _songService = songService ?? throw new System.ArgumentNullException(nameof(songService));
            _ngViews = ngViews ?? throw new System.ArgumentNullException(nameof(ngViews));
            _mapper = mapper ?? throw new System.ArgumentNullException(nameof(mapper));

            _appOptions = appOptions.CurrentValue;
            _cdnOptions = cdnOptions.CurrentValue;
        }

        /// <summary>
        /// Urls like "https://messianicradio.com?song=songs/32" need to load the server-rendered Razor
        /// page with info about that song.
        /// This is used for social media sites like Facebook and Twitter which show images, title,
        /// and description from the loaded page before any JS is executed.
        /// </summary>
        [HttpGet]
        [Route("")]
        public async Task<IActionResult> Index(string artist = null, string album = null, string song = null, bool embed = false)
        {
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

        private Task<Song> GetSongFromQuery(string artist, string album, string songId)
        {
            if (!string.IsNullOrEmpty(songId))
            {
                return _songService.GetSongByIdQueryAsync(songId);
            }

            // Both artist and album specified? Load one of those.
            if (!string.IsNullOrEmpty(artist)
                && !string.IsNullOrEmpty(album))
            {
                return _songService.GetMatchingSongAsync(s => s.Artist == artist && s.Album == album);
            }

            if (!string.IsNullOrEmpty(artist))
            {
                return _songService.GetSongByArtistAsync(artist);
            }

            if (!string.IsNullOrEmpty(album))
            {
                return _songService.GetSongByAlbumAsync(album);
            }

            return Task.FromResult<Song>(null);
        }

        [HttpGet]
        [Route("home/embed")]
        public Task<IActionResult> Embed(string artist = null, string album = null, string song = null)
        {
            return Index(artist, album, song, true);
        }

        [HttpGet]
        [Route("serviceworker")]
        public IActionResult ServiceWorker()
        {
            var path = $"~/js/ServiceWorkers/{_appOptions.ServiceWorker}";
            return File(path, "application/javascript");
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
            return RedirectPermanent("/#/forgotpassword");
        }
    }
}
