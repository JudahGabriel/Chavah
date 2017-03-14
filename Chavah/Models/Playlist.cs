using System.Collections.Generic;

namespace BitShuva.Models
{
    public class Playlist
    {
        public Playlist()
        {
            this.SongIds = new List<string>();
        }

        public string Name { get; set; }
        public List<string> SongIds { get; set; }
        public string OwnerId { get; set; }

        public Playlist CloneForUser(string userId)
        {
            return new Playlist
            {
                SongIds = new List<string>(this.SongIds),
                Name = this.Name,
                OwnerId = userId
            };
        }
    }
}