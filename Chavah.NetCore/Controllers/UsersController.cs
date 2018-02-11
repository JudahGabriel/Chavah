using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/users")]
    public class UsersController : RavenController
    {
        private static readonly DateTime startTime = DateTime.UtcNow;

        public UsersController(IAsyncDocumentSession dbSession, ILogger<UsersController> logger)
            : base(dbSession, logger)
        {

        }

        [HttpGet]
        [Route("getRecent")]
        public async Task<RecentUserSummary> GetRecent(int minutes)
        {
            var recent = DateTime.UtcNow.Subtract(TimeSpan.FromMinutes(minutes));
            var loggedInUsers = await DbSession.Query<AppUser>()
                .Where(u => u.LastSeen >= recent)
                .Select(u => u.Email)
                .ToListAsync();
            
            return new RecentUserSummary
            {
                Summary = $"{loggedInUsers.Count} logged in",
                LoggedIn = loggedInUsers,
                Anonymous = new List<string>(),
                Cookieless = new List<string>(),
                TotalSinceBeginning = loggedInUsers.Count,
                BeginningTime = DateTime.UtcNow.Subtract(startTime)
            };
        }
        
        //[HttpGet]
        //public async Task<UserProfile> GetUserProfile()
        //{
        //    var user = await this.GetCurrentUser();
        //    if (user != null)
        //    {
        //        // So that we don't inadvertently change the user in the DB.
        //        DbSession.Advanced.Evict(user); 

        //        var likedSongIds = user
        //            .Preferences
        //            .Songs
        //            .Where(s => s.LikeCount == 1)
        //            .Shuffle()
        //            .Take(5)
        //            .Select(s => s.Name)
        //            .ToList();

        //        var likedSongNames = await this.DbSession.LoadAsync<SongNameTransformer, SongNameTransformer.SongName>(likedSongIds);
        //        return new UserProfile(user, likedSongNames.Where(s => s != null).Select(s => s.Name).ToList());
        //    }

        //    return null;
        //}
    }
}