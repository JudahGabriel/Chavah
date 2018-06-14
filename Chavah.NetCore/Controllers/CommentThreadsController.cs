using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
            var getCommentThread = DbSession.Advanced.Lazily.LoadRequiredAsync<CommentThread>(commentThreadId);
            var getSongTask = DbSession.Advanced.Lazily.LoadRequiredAsync<Song>(model.SongId);
            var commentThread = await getCommentThread.Value;
            var song = await getSongTask.Value;
            
            // Add the comment and update the song's comment count.
            commentThread.Comments.Add(new Comment
            {
                Content = model.Comment,
                Date = DateTime.UtcNow,
                UserId = userId
            });
            song.CommentCount = commentThread.Comments.Count;

            return commentThread;
        }
    }
}
