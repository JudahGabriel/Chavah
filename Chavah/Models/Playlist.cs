using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class Playlist
    {

        public string Name { get; set; } = string.Empty;
        public List<string> SongIds { get; set; } = new List<string>();
        public string OwnerId { get; set; } = string.Empty;

        public Playlist CloneForUser(string userId)
        {
            return new Playlist
            {
                SongIds = new List<string>(SongIds),
                Name = Name,
                OwnerId = userId
            };
        }
    }
}
