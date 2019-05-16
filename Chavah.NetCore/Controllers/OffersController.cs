using BitShuva.Chavah.Settings;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BitShuva.Chavah.Controllers
{
    public class OffersController : Controller
    {
        private readonly ILogger<OffersController> _logger;
        private readonly CdnSettings _options;

        public OffersController(
            ILogger<OffersController> logger,
            IOptionsMonitor<CdnSettings> options)
        {
            _logger = logger;
            _options = options.CurrentValue;
        }

        public IActionResult KolYonahFreeDownload()
        {
            Request.Headers.TryGetValue("User-Agent", out var userAgent);
            _logger.LogInformation("Free Kol Yonah download has been downloaded. User agent {userAgent}", userAgent);
            return Redirect($"{_options?.HttpPath}{_options?.MusicDirectory}/Micha'el%20Eliyahu%20BenDavid/Micha_el%20Eliyahu%20BenDavid%20-%20Kol%20Yonah%20-%2010%20-%20Rejoice%20in%20Yah.mp3");
        }
    }
}
