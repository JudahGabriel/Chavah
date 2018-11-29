using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    public class ProfilePictureUpload
    {
        public IFormFile Photo { get; set; }
    }
}
