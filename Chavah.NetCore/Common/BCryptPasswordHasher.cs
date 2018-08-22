using System;
using System.Text;
using Microsoft.AspNetCore.Identity;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// A drop-in replacement for the standard Identity hasher to be backwards compatible with existing bcrypt hashes
    /// New passwords will be hashed with Identity V3
    /// </summary>
    public class BCryptPasswordHasher<TUser> : PasswordHasher<TUser> where TUser : class
    {
        readonly BCryptPasswordSettings _settings;
        public BCryptPasswordHasher(BCryptPasswordSettings settings)
        {
            _settings = settings;
        }

        public override PasswordVerificationResult VerifyHashedPassword(TUser user, string hashedPassword, string providedPassword)
        {
            if (hashedPassword == null) { throw new ArgumentNullException(nameof(hashedPassword)); }
            if (providedPassword == null) { throw new ArgumentNullException(nameof(providedPassword)); }

            byte[] decodedHashedPassword = Convert.FromBase64String(hashedPassword);

            // read the format marker from the hashed password
            if (decodedHashedPassword.Length == 0)
            {
                return PasswordVerificationResult.Failed;
            }

            // ASP.NET Core uses 0x00 and 0x01, so we start at the other end
            if (decodedHashedPassword[0] == 0xFF)
            {
                if (VerifyHashedPasswordBcrypt(decodedHashedPassword, providedPassword))
                {
                    // This is an old password hash format - the caller needs to rehash if we're not running in an older compat mode.
                    return _settings.RehashPasswords
                        ? PasswordVerificationResult.SuccessRehashNeeded
                        : PasswordVerificationResult.Success;
                }
                else
                {
                    return PasswordVerificationResult.Failed;
                }
            }

            return base.VerifyHashedPassword(user, hashedPassword, providedPassword);
        }

        private static bool VerifyHashedPasswordBcrypt(byte[] hashedPassword, string password)
        {
            if (hashedPassword.Length < 2)
            {
                return false; // bad size
            }

            //convert back to string for BCrypt, ignoring first byte
            var storedHash = Encoding.UTF8.GetString(hashedPassword, 1, hashedPassword.Length - 1);
            
            return BCrypt.Net.BCrypt.Verify(password, storedHash);
        }
    }

    public class BCryptPasswordSettings
    {
        public bool RehashPasswords { get; set; }
    }

}
