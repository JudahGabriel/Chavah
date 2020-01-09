using System;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class CommentThreadsController : RavenController
    {
        private readonly IOptions<AppSettings> appSettings;

        public CommentThreadsController(
            IOptions<AppSettings> appSettings,
            IAsyncDocumentSession dbSession,
            ILogger<CommentThreadsController> logger)
            : base(dbSession, logger)
        {
            this.appSettings = appSettings;
        }
        
        [HttpGet]
        public async Task<CommentThread> Get(string id)
        {
            var thread = await DbSession.LoadOptionalAsync<CommentThread>(id);

            // No comment thread created for the song? No worries; create a new empty one.
            // It'll be saved in the DB when a comment is first added.
            if (thread != null)
            {
                return thread;
            }

            return new CommentThread
            {
                Id = id,
                SongId = id.Substring("CommentThreads/".Length)
            };
        }

        [HttpPost]
        public async Task<CommentThread> AddComment([FromBody]AddComment commentInfo)
        {
            var user = await GetUserOrThrow();
            
            // Get the song because we'll need to increment its .CommentCount.
            var song = await DbSession.LoadRequiredAsync<Song>(commentInfo.SongId);
            
            // Get the comment thread for this song. It may be null; we created these on-demand.
            var commentThreadId = $"CommentThreads/{commentInfo.SongId}";
            var commentThread = await DbSession.LoadOptionalAsync<CommentThread>(commentThreadId);
            if (commentThread == null)
            {
                commentThread = new CommentThread
                {
                    Id = commentThreadId,
                    SongId = commentInfo.SongId
                };
                await DbSession.StoreAsync(commentThread, commentThread.Id);
            }
            
            // Add the comment and update the song's comment count.
            var newComment = new Comment
            {
                Content = commentInfo.Content,
                Date = DateTimeOffset.UtcNow,
                UserId = user.Id,
                UserDisplayName = Comment.GetUserDisplayName(user)
            };
            commentThread.Comments.Add(newComment);
            song.CommentCount = commentThread.Comments.Count;
            
            // Store an activity for it.
            var commentActivity = new Activity
            {
                Id = "Activities/",
                DateTime = DateTimeOffset.UtcNow,
                Title = $"{newComment.UserDisplayName} commented on {song.Name} by {song.Artist}",
                Description = newComment.Content,
                MoreInfoUri = song.GetSongShareLink(appSettings.Value.DefaultUrl),
                EntityId = song.Id,
                Type = ActivityType.Comment
            };
            
            await DbSession.StoreAsync(commentActivity);
            
            return commentThread;
        }
    }
}
