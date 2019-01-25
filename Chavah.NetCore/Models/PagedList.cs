using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Chavah.Models
{
    public class PagedList<T>
    {
        public PagedList()
        {
            this.Items = new List<T>();
        }

        public int Total { get; set; }
        public List<T> Items { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }
    }
}