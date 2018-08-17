namespace BitShuva.Chavah.Models
{
    public class SignInResult
    {
        public SignInStatus Status { get; set; }
        public string ErrorMessage { get; set; }
        public UserViewModel User { get; set; }
    }
}