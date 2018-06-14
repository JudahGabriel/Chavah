using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optional.Async;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class CommentThreadsController : RavenController
    {
        public CommentThreadsController(IAsyncDocumentSession dbSession, ILogger<CommentThreadsController> logger)
            : base(dbSession, logger)
        {
        }

        [HttpGet]
        public Task<CommentThread> Get(string id)
        {
            return DbSession.LoadRequiredAsync<CommentThread>(id);
        }

        [HttpPost]
        [Authorize]
        public async Task<CommentThread> AddComment(AddComment model)
        {
            var userId = this.GetUserIdOrThrow();
            var commentThreadId = "CommentThread/" + model.SongId;

            // Get the comment thread for this song. It may be null; we created these on-demand.
            var getCommentThread = DbSession.Advanced.Lazily.LoadOptionAsync<CommentThread>(commentThreadId);

            // Get the song because we'll need to increment its .CommentCount.
            var getSongTask = DbSession.Advanced.Lazily.LoadRequiredAsync<Song>(model.SongId);
            var song = await getSongTask.Value;
            var commentThread = await getCommentThread.Value
                .ToAsyncOption()
                .ValueOr(() =>
                {
                    var newThread = new CommentThread { SongId = model.SongId };
                    DbSession.StoreAsync(newThread, newThread.Id);
                    return newThread;
                });
            
            // Add the comment and update the song's comment count.
            commentThread.Comments.Add(new Comment
            {
                Content = model.Comment,
                Date = DateTimeOffset.UtcNow,
                UserId = userId,
                UserDisplayName = userId.Contains('@') ? userId.Substring(0, userId.LastIndexOf('@')) : userId
            });
            song.CommentCount = commentThread.Comments.Count;

            return commentThread;
        }
    }
}
