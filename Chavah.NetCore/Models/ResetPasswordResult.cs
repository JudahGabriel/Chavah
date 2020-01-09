namespace BitShuva.Chavah.Models
{
    public class ResetPasswordResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public bool InvalidEmail { get; set; }
    }
}
