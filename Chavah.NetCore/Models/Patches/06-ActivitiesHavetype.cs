using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Patches
{
    /// <summary>
    /// Patch that adds .Type and .EntityId to <see cref="Activity"/>.
    /// </summary>
    public class ActivitiesHaveTypeAndEntityId : PatchBase
    {
        public ActivitiesHaveTypeAndEntityId()
        {
            this.Number = 6;
            this.Collection = "Activities";
            this.Script = @"
                if (this.Title && this.Title.indexOf('was thumbed up')) {
                    this.Type = 'Like';
                } else {
                    this.Type = 'Request';
                }

                // Add entity ID if possible.
                if (this.MoreInfoUri) {
                    var songIdPrefix = '?song=';
                    var indexOfSongId = this.MoreInfoUri.indexOf(songIdPrefix);
                    if (indexOfSongId >= 0) {
                        this.EntityId = this.MoreInfoUri.substring(indexOfSongId + songIdPrefix.length);
                    }
                }
";
        }
    }
}
