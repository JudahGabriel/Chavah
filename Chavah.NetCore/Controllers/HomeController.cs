using AutoMapper;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Raven.Client.Documents.Session;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [RequireHttps]
    public class HomeController : RavenController
    {
        private readonly ISongService songService;
        private readonly IAlbumService albumService;
        private readonly IUserService userService;
        private readonly AngularCacheBustedViews ngViews;
        private readonly IOptions<AppSettings> options;
        private readonly IMapper mapper;

        public HomeController(
            ISongService songService,
            IAlbumService albumService,
            IUserService userService,
            AngularCacheBustedViews ngViews,
            IAsyncDocumentSession dbSession,
            ILogger<HomeController> logger,
            IOptions<AppSettings> options,
            IMapper mapper)
            : base(dbSession, logger)
        {
            this.songService = songService;
            this.albumService = albumService;
            this.userService = userService;
            this.ngViews = ngViews;
            this.options = options;
            this.mapper = mapper;
        }

        /// <summary>
        /// Urls like "https://messianicradio.com?song=songs/32" need to load the server-rendered Razor 
        /// page with info about that song.
        /// This is used for social media sites like Facebook and Twitter which show images, title, 
        /// and description from the loaded page.
        /// </summary>
        [HttpGet]
        [Route("")]
        public async Task<IActionResult>  Index(string artist = null, string album = null, string song = null, bool embed = false)
        {
            var user = await this.GetUser();
            var userVm = user != null ? mapper.Map<UserViewModel>(user) : null;
            var loadedSong = await this.GetSongFromQuery(artist, album, song);
            var homeViewModel = HomeViewModel.From(userVm, loadedSong, options.Value.Application, options.Value.Cdn);
            homeViewModel.Embed = embed;
            homeViewModel.CacheBustedAngularViews = this.ngViews.Views;

            // TODO
            //homeViewModel.Redirect = 
            
            return View("Index", homeViewModel);
        }

        private Task<Song> GetSongFromQuery(string artist, string album, string songId)
        {
            if (!string.IsNullOrEmpty(songId))
            {
                return songService.GetSongByIdQueryAsync(songId);
            }

            // Both artist and album specified? Load one of those.
            if (!string.IsNullOrEmpty(artist) && !string.IsNullOrEmpty(album))
            {
                return songService.GetMatchingSongAsync(s => s.Artist == artist && s.Album == album);
            }

            if (!string.IsNullOrEmpty(artist))
            {
                return songService.GetSongByArtistAsync(artist);
            }

            if (!string.IsNullOrEmpty(album))
            {
                return songService.GetSongByAlbumAsync(album);
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
        public IActionResult ActivityFeed()
        {
            return RedirectToActionPermanent("ActivityFeed", "Activities");
        }
    }
}