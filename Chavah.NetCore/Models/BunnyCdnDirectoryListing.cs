using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    public class BunnyCdnDirectoryListing
    {
        public Guid Guid { get; set; }
        public string? StorageZoneName { get; set; }
        public string? Path { get; set; }
        public string ObjectName { get; set; } = string.Empty;
        public long Length { get; set; }
        public DateTime LastChanged { get; set; }
        public bool IsDirectory { get; set; }
        public int ServerId { get; set; }
        public Guid UserId { get; set; }
        public DateTime DateCreated { get; set; }
        public int StorageZoneId { get; set; }
    }
}
