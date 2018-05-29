using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Patches
{
    /// <summary>
    /// Patches AppUsers to have a .Volume preference.
    /// </summary>
    public class UsersHaveVolumePreference : PatchBase
    {
        public UsersHaveVolumePreference()
        {
            this.Number = 7;
            this.Collection = "AppUsers";
            this.Script = @"
                if (!this.Volume) {
                    this.Volume = 1;
                }
";
        }
    }
}
