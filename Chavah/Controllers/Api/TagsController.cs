using BitShuva.Models.Indexes;
using BitShuva.Services;
using Raven.Abstractions.Data;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace BitShuva.Controllers.Api
{
    [RoutePrefix("api/tags")]
    public class TagsController : RavenApiController
    {
        [Authorize(Roles = "Admin")]
        [Route("getAll")]
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
        [Route("searchTags")]
        public async Task<IEnumerable<string>> SearchTags(string search)
        {
            var result = await DbSession.Query<Songs_Tags.Result, Songs_Tags>()
                .Search(i => i.Name, search + "*", 1, SearchOptions.Guess, EscapeQueryOptions.AllowPostfixWildcard)
                .Take(10)
                .ToListAsync();
            return result.Select(r => r.Name);
        }

        [HttpPost]
        [Route("rename")]
        [Authorize(Roles = "Admin")]
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
            var patch = new CollectionPatchService("Songs", patchScript, patchVariables);
            await patch.Execute();

            return newTag;
        }

        [HttpPost]
        [Route("delete")]
        [Authorize(Roles = "Admin")]
        public async Task Delete(string tag)
        {
            if (string.IsNullOrWhiteSpace(tag))
            {
                throw new ArgumentException("tag must not be empty");
            }

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
            var patch = new CollectionPatchService("Songs", patchScript, patchVariables);
            await patch.Execute();
        }
    }
}