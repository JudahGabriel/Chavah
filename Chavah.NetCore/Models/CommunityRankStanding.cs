using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// Defines how well a song is ranked among its peers.
    /// </summary>
    public enum CommunityRankStanding
    {
        /// <summary>
        /// The song's community rank is average.
        /// </summary>
        Normal = 0,
        /// <summary>
        /// The song's community rank is very poor, much lower than average.
        /// </summary>
        VeryPoor = 1,
        /// <summary>
        /// The song's community rank is poor, lower than average.
        /// </summary>
        Poor = 2,
        /// <summary>
        /// The song's community rank is good, better than average.
        /// </summary>
        Good = 3,
        /// <summary>
        /// The song's community rank is very good, much better than average.
        /// </summary>
        Great = 4,
        /// <summary>
        /// The song's community rank is exteremly good, one of the top songs on the station.
        /// </summary>
        Best = 5
    }
}