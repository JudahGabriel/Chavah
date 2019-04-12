using System;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// This is a notification that shows up in the user's "unread" alerts menu.
    /// </summary>
    public class Notification
    {
        public string Title { get; set; }
        public string Url { get; set; }
        public bool IsUnread { get; set; }
        public string SourceName { get; set; }
        public string ImageUrl { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;

        public static Notification Welcome(string chavahAuthorImageUrl)
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
                Title = "Your lyrics/tags submission has been approved",
                Url = $"/#/songeditapproved/{Uri.EscapeDataString(song.Artist)}/{Uri.EscapeDataString(song.Name)}",
                IsUnread = true,
                SourceName = "Chavah Messianic Radio"
            };
        }

        public static Notification SongEditsNeedApproval(string chavahSystemNotificationImage)
        {
            return new Notification
            {
                ImageUrl = chavahSystemNotificationImage,
                Title = "New song edits awaiting your approval",
                Url = "/#/admin/songedits",
                IsUnread = true,
                SourceName = "Chavah Messianic Radio"
            };
        }
    }
}
