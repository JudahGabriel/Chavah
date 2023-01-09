using System;
using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// A record of when blog feeds were synced to AppUser.Notifications.
    /// Used in coordination with <see cref="BitShuva.Chavah.Services.BlogPostNotificationCreator"/>.
    /// </summary>
    public class FeedSyncRecord
    {
        public const string SingletonId = "FeedSyncRecords/1";

        /// <summary>
        /// The ID of the sync record. This will always be "FeedSyncRecords/1", because we only ever store a single instance of this in the database.
        /// </summary>
        public string Id { get; init; } = SingletonId; // We only have 1 feed sync record

        /// <summary>
        /// The published date of the last blog post synced to App User Notifications.
        /// </summary>
        public DateTimeOffset LastSyncedPostDate { get; set; } = DateTimeOffset.UtcNow;

        /// <summary>
        /// A list of notifications synced to each user.
        /// </summary>
        public List<Notification> SyncedNotifications { get; init; } = new List<Notification>();

        /// <summary>
        /// A list of blog post IDs we've synced to AppUser Notifications.
        /// </summary>
        public List<string> SyncedPostIds { get; init; } = new List<string>();

        /// <summary>
        /// Adds a notification that we've synced from a blog feed. If the count exceeds 10, we remove the oldest.
        /// </summary>
        /// <param name="notification"></param>
        public void AddSyncedNotification(Notification notification)
        {
            this.SyncedNotifications.Insert(0, notification);
            if (this.SyncedNotifications.Count > 10)
            {
                this.SyncedNotifications.RemoveAt(10);
            }
        }

        /// <summary>
        /// Adds the ID of a blog post that has been synced to user notifications.
        /// </summary>
        /// <param name="id"></param>
        public void AddSyncedPostId(string id)
        {
            this.SyncedPostIds.Add(id);
            if (this.SyncedPostIds.Count > 10)
            {
                this.SyncedPostIds.RemoveAt(10);
            }
        }
    }
}
