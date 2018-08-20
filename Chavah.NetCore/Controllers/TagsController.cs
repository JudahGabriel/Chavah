using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optional;
using Raven.Client.Documents;
using Raven.Client.Documents.Operations;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/[controller]/[action]")]
    [Authorize(Policy = Policies.Administrator)]
    [ApiController]
    public class TagsController : RavenController
    {
        private const string AuthSchemes = CookieAuthenticationDefaults.AuthenticationScheme; //+ "," +
                                           //JwtBearerDefaults.AuthenticationScheme;

        public TagsController(IAsyncDocumentSession dbSession, ILogger<TagsController> logger)
            : base(dbSession, logger)
        {
        }

        /// <summary>
        /// Get all songs tags. Limited to 1000 records.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<List<string>> GetAll()
        {
            var tags = new List<string>(1000);
            var streamResult = await DbSession.Advanced.StreamAsync(DbSession.Query<Songs_Tags.Result, Songs_Tags>())
                .ConfigureAwait(false);
            while (await streamResult.MoveNextAsync().ConfigureAwait(false))
            {
                tags.Add(streamResult.Current.Document.Name);
            }

            return tags;
        }

        /// <summary>
        /// Search tags in the database
        /// </summary>
        /// <param name="search"></param>
        /// <returns></returns>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IEnumerable<string>> SearchTags(string search)
        {
            var result = await DbSession.Query<Songs_Tags.Result, Songs_Tags>()
                .Search(i => i.Name, search + "*", 1, SearchOptions.Guess)
                .Take(10)
                .ToListAsync()
                .ConfigureAwait(false);

            return result.Select(r => r.Name);
        }

        /// <summary>
        /// Rename existing songs and tag.
        /// </summary>
        /// <param name="oldTag"></param>
        /// <param name="newTag"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<string> Rename(string oldTag, string newTag)
        {
            if (string.IsNullOrWhiteSpace(oldTag))
            {
                throw new ArgumentException("oldTag must not be empty");
            }
            if (string.IsNullOrWhiteSpace(newTag))
            {
                throw new ArgumentException("newTag must not be empty");
            }

            newTag = newTag.Trim().ToLower();

            // Fix up the tag name in each song.
            const string patchScript = @"
                if (this.Tags && this.Tags.length) {
                    var oldTagIndex = this.Tags.indexOf(oldTag);
                    if (oldTagIndex >= 0)
                    {
                        this.Tags.splice(oldTagIndex, 1);

                        var newTagIndex = this.Tags.indexOf(newTag);
                        if (newTagIndex === -1) {
                            this.Tags.splice(oldTagIndex, 0, newTag);
                        }
                    }
                }";
            var patchVariables = new Dictionary<string, object>
            {
                { "oldTag", oldTag },
                { "newTag", newTag }
            };
            var patch = DbSession.Advanced.DocumentStore.PatchAll<Song>(patchScript, patchVariables.Some());
            await PatchWithTimeout(patch, TimeSpan.FromSeconds(30)).ConfigureAwait(false);
            return newTag;
        }

        /// <summary>
        /// Delete existing tag.
        /// </summary>
        /// <param name="tag"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task Delete(string tag)
        {
            if (string.IsNullOrWhiteSpace(tag))
            {
                throw new ArgumentException("tag must not be empty");
            }

            // Patch all songs so that it no longer has this tag.
            const string patchScript = @"
                if (this.Tags && this.Tags.length) {
                    var tagIndex = this.Tags.indexOf(tag);
                    if (tagIndex >= 0)
                    {
                        this.Tags.splice(tagIndex, 1);
                    }
                }";

            var patchVariables = new Dictionary<string, object>
            {
                { "tag", tag }
            };

            var patch = DbSession.Advanced.DocumentStore.PatchAll<Song>(patchScript, patchVariables.Some());
            await PatchWithTimeout(patch, TimeSpan.FromSeconds(30)).ConfigureAwait(false);
        }

        private async Task PatchWithTimeout(Operation patch, TimeSpan timeout)
        {
            try
            {
                await patch.WaitForCompletionAsync(timeout).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Patching tags didn't finish in the alloted time");
            }
        }
    }
}