using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Web;

namespace BitShuva.Common
{
    public struct Range
    {
        public Range(double min, double additionFromMin)
            : this()
        {
            Contract.Requires(additionFromMin >= 0);

            this.Start = min;
            this.End = min + additionFromMin;
        }

        public bool IsWithinRange(double value)
        {
            return value >= this.Start && value <= this.End;
        }

        public double Start { get; set; }
        public double End { get; set; }
    }
}