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

namespace BitShuva.Controllers
{
    [RoutePrefix("api/users")]
    public class UsersController : UserContextController
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
            var user = await this.GetLoggedInUserOrNull();
            var sessionId = "";
            if (user != null && !string.IsNullOrEmpty(user.EmailAddress))
            {
                sessionId = user.EmailAddress;
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
        [Route("clearjudah")]
        public async Task<string> ClearJudah()
        {
            var user = await this.Session.LoadAsync<User>("users/38055");
            user.Preferences.Songs = new System.Collections.Generic.List<LikeDislikeCount>();
            return "OK!";
        }

        [HttpGet]
        [Route("fixupjudah")]
        public async Task<string> FixUpJudah()
        {
            var user = await this.Session.LoadAsync<User>("users/38055");
            var likes = await this.Session.Query<Like>().Skip(user.Preferences.Songs.Count).Where(l => l.UserId == user.Id).ToListAsync();
            user.Preferences.Songs.AddRange(likes.Select(l => new LikeDislikeCount
                {
                    Name = l.SongId,
                    LikeCount = l.Status == LikeStatus.Like ? 1 : 0,
                    DislikeCount = l.Status == LikeStatus.Dislike ? 1 : 0,
                }));
            return string.Format("Update successful. Total updated: {0}", likes.Count);
        }

        [HttpGet]
        [Authorize]
        public async Task<UserProfile> GetUserProfile()
        {
            var user = await this.GetLoggedInUserOrNull();
            if (user != null)
            {
                // So that we don't inadvertently change the user in the DB.
                Session.Advanced.Evict(user); 

                var likedSongIds = user
                    .Preferences
                    .Songs
                    .Where(s => s.LikeCount == 1)
                    .Shuffle()
                    .Take(5)
                    .Select(s => s.Name)
                    .ToList();

                var likedSongNames = await this.Session.LoadAsync<SongNameTransformer, SongNameTransformer.SongName>(likedSongIds);
                return new UserProfile(user, likedSongNames.Where(s => s != null).Select(s => s.Name).ToList());
            }

            return null;
        }
    }
}