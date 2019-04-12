using Microsoft.AspNetCore.Http;

namespace BitShuva.Chavah.Models
{
    public class ProfilePictureUpload
    {
        public IFormFile Photo { get; set; }
    }
}
