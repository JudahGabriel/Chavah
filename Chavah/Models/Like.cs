using System;

namespace BitShuva.Chavah.Models
{
    public class Like
    {
        public Like()
        {
        }

        public Like(AppUser user, string songId, LikeStatus status)
        {
            var userId = user.Id ?? "AppUsers/" + user.Email;
            Id = GetLikeId(userId, songId);
            UserId = userId;
            SongId = songId;
            Date = DateTime.Now;
            Status = status;
        }

        public string? Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string SongId { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public LikeStatus Status { get; set; }

        public static string GetLikeId(string userId, string songId)
        {
            return $"Likes/{userId}/{songId}";
        }
    }
}
