using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optional;
using Raven.Client;
using Raven.Client.Documents;
using Raven.Client.Documents.Operations;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class TagsController : RavenController
    {
        public TagsController(IAsyncDocumentSession dbSession, ILogger<TagsController> logger)
            : base(dbSession, logger)
        {
        }

        [HttpGet]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task<List<string>> GetAll()
        {
            var tags = new List<string>(1000);
            var streamResult = await DbSession.Advanced.StreamAsync(DbSession.Query<Songs_Tags.Result, Songs_Tags>());
            while (await streamResult.MoveNextAsync())
            {
                tags.Add(streamResult.Current.Document.Name);
            }

            return tags;
        }

        [HttpGet]
        public async Task<IEnumerable<string>> SearchTags(string search)
        {
            var result = await DbSession.Query<Songs_Tags.Result, Songs_Tags>()
                .Search(i => i.Name, search + "*", 1, SearchOptions.Guess)
                .Take(10)
                .ToListAsync();
            return result.Select(r => r.Name);
        }

        [HttpPost]
        [Authorize(Roles = AppUser.AdminRole)]
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
            var patchScript = @"
                if (this.Tags && this.Tags.length) {
                    var oldTagIndex = this.Tags.indexOf(oldTag);
                    if (oldTagIndex >= 0)
                    {
                        // Remove the old tag.
                        this.Tags.splice(oldTagIndex, 1);

                        // Add the new tag if it's not already added.
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
            await this.PatchWithTimeout(patch, TimeSpan.FromSeconds(30));
            return newTag;
        }

        [HttpPost]
        [Route("delete")]
        [Authorize(Roles = AppUser.AdminRole)]
        public async Task Delete(string tag)
        {
            if (string.IsNullOrWhiteSpace(tag))
            {
                throw new ArgumentException("tag must not be empty");
            }

            // Patch all songs so that it no longer has this tag.
            var patchScript = @"
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
            await PatchWithTimeout(patch, TimeSpan.FromSeconds(30));
        }

        private async Task PatchWithTimeout(Operation patch, TimeSpan timeout)
        {
            try
            {
                await patch.WaitForCompletionAsync(timeout);
            }
            catch (Exception error)
            {
                logger.LogWarning(error, "Patching tags didn't finish in the alloted time");
            }
        }
    }
}