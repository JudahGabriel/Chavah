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

namespace BitShuva.Controllers
{
    [RoutePrefix("api/users")]
    [JwtSession]
    public class UsersController : RavenApiController
    {
        static DateTime startTime = DateTime.UtcNow;
        static ConcurrentDictionary<string, DateTime> allUsers = new ConcurrentDictionary<string, DateTime>();

        [HttpGet]
        [Route("recent/mins/{minutes}")]
        public RecentUserSummary Recent(int minutes)
        {
            var recent = DateTime.UtcNow.Subtract(TimeSpan.FromMinutes(minutes));
            var recentUsers = allUsers.Where(u => u.Value >= recent).ToList();
            var loggedInUsers = recentUsers
                .Where(u => u.Key.Contains("@"))
                .Select(u => u.Key)
                .ToList();
            var anonymousUsers = recentUsers
                .Where(u => !loggedInUsers.Contains(u.Key) && !u.Key.StartsWith("cookieless", StringComparison.InvariantCultureIgnoreCase))
                .Select(u => u.Key)
                .ToList();
            var cookielessUsers = recentUsers
                .Where(u => u.Key.StartsWith("cookieless", StringComparison.InvariantCultureIgnoreCase))
                .Select(u => u.Key)
                .ToList();
            return new RecentUserSummary
            {
                Summary = string.Format("{0} total: {1} logged in, {2} anonymous, {3} cookieless", recentUsers.Count, loggedInUsers.Count, anonymousUsers.Count, cookielessUsers.Count),
                LoggedIn = loggedInUsers,
                Anonymous = anonymousUsers,
                Cookieless = cookielessUsers,
                TotalSinceBeginning = allUsers.Count,
                BeginningTime = DateTime.UtcNow.Subtract(startTime)
            };
        }

        [HttpGet]
        [Route("ping")]
        public async Task Ping()
        {
            var user = await this.GetCurrentUser();
            var sessionId = "";
            if (user != null && !string.IsNullOrEmpty(user.Email))
            {
                sessionId = user.Email;
            }
            else
            {
                var sessionCookies = this.Request.Headers.GetCookies("SessionId");
                if (sessionCookies != null && sessionCookies.Count > 0 && sessionCookies[0].Cookies.Count > 0)
                {
                    sessionId = sessionCookies[0].Cookies[0].Value;
                }
            }

            if (string.IsNullOrEmpty(sessionId))
            {
                var id = Guid.NewGuid().ToString();
                var cookie = new System.Web.HttpCookie("SessionId") { Value = id };
                System.Web.HttpContext.Current.Response.SetCookie(cookie);
                sessionId = "CookielessUser_" + id;
            }

            allUsers.AddOrUpdate(sessionId, DateTime.UtcNow, (id, date) => DateTime.UtcNow);
        }

        [HttpGet]
        [Route("AuthenticatedName")]
        public string AuthenticatedName()
        {
            return this.User.Identity.Name;
        }
        
        [HttpGet]
        public async Task<UserProfile> GetUserProfile()
        {
            var user = await this.GetCurrentUser();
            if (user != null)
            {
                // So that we don't inadvertently change the user in the DB.
                DbSession.Advanced.Evict(user); 

                var likedSongIds = user
                    .Preferences
                    .Songs
                    .Where(s => s.LikeCount == 1)
                    .Shuffle()
                    .Take(5)
                    .Select(s => s.Name)
                    .ToList();

                var likedSongNames = await this.DbSession.LoadAsync<SongNameTransformer, SongNameTransformer.SongName>(likedSongIds);
                return new UserProfile(user, likedSongNames.Where(s => s != null).Select(s => s.Name).ToList());
            }

            return null;
        }
    }
}