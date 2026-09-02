using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    public class PagedList<T>
    {
        public PagedList()
        {
            Items = new List<T>();
        }

        public long Total { get; set; }
        public List<T> Items { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }
    }
}
