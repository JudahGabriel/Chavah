namespace BitShuva.Chavah.Models
{
    public class AudioErrorInfo
    {
        public Html5MediaError? ErrorCode { get; set; }
        public string? SongId { get; set; }
        public double? TrackPosition { get; set; }
        public string? UserId { get; set; }
        public string? Mp3Url { get; set; }
    }
}
