using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models
{
    public class SongEdit
    {
        public SongEdit()
        {
        }

        public SongEdit(Song existing, Song updated)
        {
            this.SongId = updated.Id;
            this.NewArtist = updated.Artist;
            this.NewAlbum = updated.Album;
            this.NewName = updated.Name;
            this.NewLyrics = updated.Lyrics;
            this.NewTags = updated.Tags;
            this.OldArtist = existing.Artist;
            this.OldAlbum = existing.Album;
            this.OldLyrics = existing.Lyrics;
            this.OldName = existing.Name;
            this.OldTags = existing.Tags;
        }

        public string Id { get; set; }
        public SongEditStatus Status { get; set; }
        public DateTime SubmitDate { get; set; } = DateTime.UtcNow;
        public string UserId { get; set; }
        public string SongId { get; set; }
        public string NewArtist { get; set; }
        public string NewAlbum { get; set; }
        public string NewName { get; set; }
        public List<string> NewTags { get; set; } = new List<string>();
        public string NewLyrics { get; set; }
        public string OldArtist { get; set; }
        public string OldAlbum { get; set; }
        public string OldLyrics { get; set; }
        public string OldName { get; set; }
        public List<string> OldTags { get; set; } = new List<string>();

        public bool HasAnyChanges()
        {
            return this.NewArtist != this.OldArtist ||
                this.NewAlbum != this.OldAlbum ||
                this.NewName != this.OldName ||
                this.NewLyrics != this.OldLyrics ||
                !this.NewTags.SequenceEqual(this.OldTags);
        }

        public void Apply(Song song)
        {
            song.Album = this.NewAlbum;
            song.Artist = this.NewArtist;
            song.Lyrics = this.NewLyrics;
            song.Name = this.NewName;
            song.Tags = this.NewTags;
        }
    }
}