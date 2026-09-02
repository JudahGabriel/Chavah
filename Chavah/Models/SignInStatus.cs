namespace BitShuva.Chavah.Models
{
    public enum SignInStatus
    {
        Success = 0,
        LockedOut = 1,
        RequiresVerification = 2,
        Failure = 3,
        Pwned = 4
    }
}
