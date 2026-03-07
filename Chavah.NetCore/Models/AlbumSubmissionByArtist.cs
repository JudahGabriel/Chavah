using System;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// An album submitted by an end user, usually the artist themselves.
    /// </summary>
    public class AlbumSubmissionByArtist : AlbumUpload
    {
        /// <summary>
        /// The database ID of the entity.
        /// </summary>
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// The email of the user submitting the album. This is used to contact the artist if there are any questions or issues with the submission.
        /// </summary>
        public required string ArtistEmail { get; set; }

        /// <summary>
        /// The PayPal email of the artist. This is used to pay the artist Messiah's Music Fund disbursements.
        /// </summary>
        public required string ArtistPayPalEmail { get; set; }

        /// <summary>
        /// The status of the album submission.
        /// </summary>
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;

        /// <summary>
        /// The date and time when the album submission was uploaded.
        /// </summary>
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
