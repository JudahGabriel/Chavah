using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BitShuva.Chavah.Controllers
{
    public class OffersController : Controller
    {
        private readonly ILogger<OffersController> logger;
        private readonly IHostingEnvironment host;
        private readonly IOptions<AppSettings> options;

        public OffersController(IHostingEnvironment host, 
                                ILogger<OffersController> logger,
                                IOptions<AppSettings> options)
        {
            this.logger = logger;
            this.host = host;
            this.options = options;
        }

        public IActionResult KolYonahFreeDownload()
        {
            Request.Headers.TryGetValue("User-Agent", out var userAgent);
            logger.LogInformation("Free Kol Yonah download has been downloaded. User agent {userAgent}", userAgent);
            return Redirect($"{options?.Value?.Cdn?.HttpPath}{options?.Value?.Cdn?.MusicDirectory}/Micha'el%20Eliyahu%20BenDavid/Micha_el%20Eliyahu%20BenDavid%20-%20Kol%20Yonah%20-%2010%20-%20Rejoice%20in%20Yah.mp3");
        }
    }
}