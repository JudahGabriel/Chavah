using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    public class HomeViewModel
    {
        public HomeViewModel()
        {
#if DEBUG
            Debug = true;
#endif
        }

        public string UserEmail { get; set; }
        public List<string> UserRoles { get; set; } = new List<string>();
        public List<Notification> Notifications { get; set; } = new List<Notification>();
        public string Jwt { get; set; }
        public bool Debug { get; set; }
        public string Redirect { get; set; }
        public bool Embed { get; set; }
        public string PageTitle { get; set; } = "Chavah Messianic Radio";
        public string PageDescription { get; set; } = "Music for Yeshua's disciples";
        public string DescriptiveImageUrl { get; set; }
        public Song Song { get; set; }
        public string SongNth { get; set; }

        public string NotificationsToJsArray()
        {
            return JsonConvert.SerializeObject(this.Notifications, new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            });
        }
    }
}