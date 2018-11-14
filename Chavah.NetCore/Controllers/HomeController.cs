using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [RequireHttps]
    public class HomeController : RavenController
    {
        private readonly ISongService songService;
        private readonly IAlbumService albumService;
        private readonly IUserService userService;
        private readonly AngularCacheBustedViews cacheBustedNgViews;
        private readonly IOptions<AppSettings> options;
        private readonly IMapper mapper;

        public HomeController(
            ISongService songService,
            IAlbumService albumService,
            IUserService userService,
            AngularCacheBustedViews cacheBustedNgViews,
            IAsyncDocumentSession dbSession,
            ILogger<HomeController> logger,
            IOptions<AppSettings> options,
            IMapper mapper)
            : base(dbSession, logger)
        {
            this.songService = songService;
            this.albumService = albumService;
            this.userService = userService;
            this.cacheBustedNgViews = cacheBustedNgViews;
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
        public async Task<IActionResult> Index(string artist = null, string album = null, string song = null, bool embed = false)
        {
            var viewModel = await GetConfigurationModel(artist, album, song, embed).ConfigureAwait(false);

            var userName = User.Identity.Name;
            AppUser user = null;
            if (!string.IsNullOrEmpty(userName))
            {
                user = await GetCurrentUser().ConfigureAwait(false);
            }

            var model = new HomeViewModel
            {
                DescriptiveImageUrl = viewModel.DescriptiveImageUrl,
                User = mapper.Map<UserViewModel>(user)
            };

            return View("Index", model);
        }

        private async Task<ConfigViewModel> GetConfigurationModel(string artist, string album, string song, bool embed)
        {
            var viewModel = new ConfigViewModel
            {
                Embed = embed,
                CacheBustedAngularViews = this.cacheBustedNgViews.Views,
                Title = options.Value.Application.Title,
                Description = options.Value.Application?.Description,
                DefaultUrl = options.Value.Application?.DefaultUrl,
                CdnUrl = options.Value.Cdn.HttpPath,
                SoundEffects = new Uri(options.Value.Cdn.HttpPath).Combine(options.Value.Cdn.SoundEffects).ToString()
            };

            var firstValidQuery = new[] { artist, album, song }.FirstOrDefault(s => !string.IsNullOrEmpty(s));
            if (firstValidQuery != null)
            {
                var taskOrNull = firstValidQuery == song ? songService.GetSongByIdQueryAsync(firstValidQuery) :
                    firstValidQuery == artist ? songService.GetSongByArtistAsync(firstValidQuery) :
                    firstValidQuery == album ? songService.GetSongByAlbumAsync(firstValidQuery) :
                    null;

                if (taskOrNull != null)
                {
                    var songForQuery = await taskOrNull;
                    if (songForQuery != null)
                    {
                        var albumData = await albumService.GetMatchingAlbumAsync(a => a.Name == songForQuery.Album && a.Artist == songForQuery.Artist);
                        viewModel.PageTitle = $"{songForQuery.Name} by {songForQuery.Artist} on {options?.Value?.Application?.Title}";
                        viewModel.DescriptiveImageUrl = albumData?.AlbumArtUri?.ToString();
                        viewModel.Song = songForQuery;
                        viewModel.SongNth = songForQuery.Number.ToNumberWord();
                    }
                }
            }

            return viewModel;
        }

        [HttpGet]
        [Route("config.json")]
        public Task<ConfigViewModel> GetConfiguration()
        {
            return GetConfigurationModel(null,null,null,false);
        }

        /// <summary>
        /// UI that doesn't require HTTPS. Used for Windows XP and old Android that doesn't support LetsEncrypt certs.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public Task<IActionResult> Legacy(string artist = null, string album = null, string song = null)
        {
            //log the User Agent
            Request.Headers.TryGetValue("User-Agent", out var userAgent);
            logger.LogInformation("Loaded non-HTTPS Chavah via /home/legacy. {userAgent}", userAgent.ToString() ?? string.Empty);
            return Index(artist, album, song);
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