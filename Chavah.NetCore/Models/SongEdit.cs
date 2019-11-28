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

        public string Id { get; set; } = string.Empty;
        public SongEditStatus Status { get; set; }
        public DateTime SubmitDate { get; set; } = DateTime.UtcNow;
        public string UserId { get; set; } = string.Empty;
        public string SongId { get; set; } = string.Empty;
        public string NewArtist { get; set; } = string.Empty;
        public string NewAlbum { get; set; } = string.Empty;
        public string NewName { get; set; } = string.Empty;
        public string NewHebrewName { get; set; } = string.Empty;
        public List<string> NewTags { get; set; } = new List<string>();
        public List<string> NewContributingArtists { get; set; } = new List<string>();
        public string NewLyrics { get; set; } = string.Empty;
        public string OldArtist { get; set; } = string.Empty;
        public string OldAlbum { get; set; } = string.Empty;
        public string OldLyrics { get; set; } = string.Empty;
        public string OldName { get; set; } = string.Empty;
        public string OldHebrewName { get; set; } = string.Empty;
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
