using BitShuva.Models;
using BitShuva.Models.Transformers;
using BitShuva.Common;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using Optional;
using Microsoft.AspNet.Identity.Owin;
using BitShuva.Services;
using System.Collections.Generic;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/users")]
    [JwtSession]
    public class UsersController : RavenApiController
    {
        static DateTime startTime = DateTime.UtcNow;

        [HttpGet]
        [Route("getRecent")]
        public async Task<RecentUserSummary> GetRecent(int minutes)
        {
            var recent = DateTime.UtcNow.Subtract(TimeSpan.FromMinutes(minutes));
            var loggedInUsers = await DbSession.Query<ApplicationUser>()
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