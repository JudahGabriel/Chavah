using BitShuva.Interfaces;
using BitShuva.Models;
using System.Web.Mvc;

namespace BitShuva.Controllers
{
    public class OffersController : RavenController
    {
        private ILoggerService _logger;

        public OffersController(ILoggerService logger)
        {
            _logger = logger;
        }
        public FileResult KolYonahFreeDownload()
        {
            _logger.Info("Free Kol Yonah download has been downloaded", Request.UserAgent);
            //ChavahLog.Info(this.DbSession, "Free Kol Yonah download has been downloaded", Request.UserAgent);
            var filePath = Server.MapPath("~/Content/offers/Micha'el Eliyahu BenDavid - Kol Yonah - 10 - Rejoice in Yah.mp3");
            return File(filePath, "audio/mpeg", "Rejoice in Yah.mp3");
        }
    }
}