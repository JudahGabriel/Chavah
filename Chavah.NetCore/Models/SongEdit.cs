using System;
using System.Collections.Generic;
using System.Linq;

namespace BitShuva.Chavah.Models
{
    public class SongEdit
    {
        public SongEdit()
        {
        }

        public SongEdit(Song existing, Song updated)
        {
            SongId = updated.Id;
            NewArtist = updated.Artist;
            NewAlbum = updated.Album;
            NewName = updated.Name;
            NewHebrewName = updated.HebrewName;
            NewLyrics = updated.Lyrics;
            NewTags = updated.Tags;
            NewContributingArtists = updated.ContributingArtists;
            OldArtist = existing.Artist;
            OldAlbum = existing.Album;
            OldLyrics = existing.Lyrics;
            OldName = existing.Name;
            OldHebrewName = existing.HebrewName;
            OldTags = existing.Tags;
            OldContributingArtists = existing.ContributingArtists;
        }

        public string Id { get; set; }
        public SongEditStatus Status { get; set; }
        public DateTime SubmitDate { get; set; } = DateTime.UtcNow;
        public string UserId { get; set; }
        public string SongId { get; set; }
        public string NewArtist { get; set; }
        public string NewAlbum { get; set; }
        public string NewName { get; set; }
        public string NewHebrewName { get; set; }
        public List<string> NewTags { get; set; } = new List<string>();
        public List<string> NewContributingArtists { get; set; } = new List<string>();
        public string NewLyrics { get; set; }
        public string OldArtist { get; set; }
        public string OldAlbum { get; set; }
        public string OldLyrics { get; set; }
        public string OldName { get; set; }
        public string OldHebrewName { get; set; }
        public List<string> OldTags { get; set; } = new List<string>();
        public List<string> OldContributingArtists { get; set; } = new List<string>();

        public bool HasAnyChanges()
        {
            return NewArtist != OldArtist
                || NewAlbum != OldAlbum
                || NewName != OldName
                || NewHebrewName != OldHebrewName
                || NewLyrics != OldLyrics
                || !NewTags.SequenceEqual(OldTags)
                || !NewContributingArtists.SequenceEqual(OldContributingArtists);
        }

        public void Apply(Song song)
        {
            song.Album = NewAlbum;
            song.Artist = NewArtist;
            song.Lyrics = NewLyrics;
            song.Name = NewName;
            song.Tags = NewTags;
            song.HebrewName = NewHebrewName;
            song.ContributingArtists = NewContributingArtists;
        }
    }
}
