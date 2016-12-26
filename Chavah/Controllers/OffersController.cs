using BitShuva.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web.Mvc;

namespace BitShuva.Controllers
{
    public class OffersController : RavenController
    {
        public FileResult KolYonahFreeDownload()
        {
            ChavahLog.Info(this.DbSession, "Free Kol Yonah download has been downloaded", Request.UserAgent);
            var filePath = Server.MapPath("~/Content/offers/Micha'el Eliyahu BenDavid - Kol Yonah - 10 - Rejoice in Yah.mp3");
            return File(filePath, "audio/mpeg", "Rejoice in Yah.mp3");
        }
    }
}