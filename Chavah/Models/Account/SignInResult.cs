namespace BitShuva.Chavah.Models.Account
{
    public class SignInResult
    {
        public SignInStatus Status { get; set; }
        public string? ErrorMessage { get; set; }
        public UserViewModel? User { get; set; }
    }
}
