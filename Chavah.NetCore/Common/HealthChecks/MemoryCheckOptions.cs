﻿namespace Microsoft.Extensions.HealthChecks
{
    public class MemoryCheckOptions
    {
        //Failure threshold (in bytes)
        /// <summary>
        /// 1073741824 Bytes Failure threshold (in bytes) or 1024MB, 1Gig
        /// </summary>
        public long Threshold { get; set; } = 1024L * 1024L * 1024L;
    }
}