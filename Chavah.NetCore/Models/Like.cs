using System;

namespace BitShuva.Chavah.Models
{
    public class Like
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string SongId { get; set; }
        public DateTime Date { get; set; }
        public LikeStatus Status { get; set; }

        public static string GetLikeId(string userId, string songId)
        {
            return $"Likes/{userId}/{songId}";
        }
    }
}