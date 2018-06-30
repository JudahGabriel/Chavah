using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    public class Notification
    {
        public string Title { get; set; }
        public string Url { get; set; }
        public bool IsUnread { get; set; }
        public string SourceName { get; set; }
        public string ImageUrl { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;

        private const string chavahAuthorImageUrl = "https://bitshuvafiles01.com/chavah/judah.jpg?v=1";
        private const string chavahSystemNotificationImage = "https://bitshuvafiles01.com/chavah/chavah-blog.jpg?v=2";

        public static Notification Welcome()
        {
            return new Notification
            {
                ImageUrl = chavahAuthorImageUrl,
                Title = "Welcome to Chavah!",
                Url = "/#/welcome",
                IsUnread = true,
                SourceName = "Chavah Messianic Radio"
            };
        }

        public static Notification SongEditApproved(Song song)
        {
            return new Notification
            {
                ImageUrl = $"/api/albums/GetAlbumArtBySongId?songId={song.Id}",
                Title = $"Your lyrics/tags submission has been approved",
                Url = $"/#/songeditapproved/{Uri.EscapeDataString(song.Artist)}/{Uri.EscapeDataString(song.Name)}",
                IsUnread = true,
                SourceName = "Chavah Messianic Radio"
            };
        }

        public static Notification SongEditsNeedApproval()
        {
            return new Notification
            {
                ImageUrl = chavahSystemNotificationImage,
                Title = $"New song edits awaiting your approval",
                Url = $"/#/admin/songedits",
                IsUnread = true,
                SourceName = "Chavah Messianic Radio"
            };
        }
    }
}