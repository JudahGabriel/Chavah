using System.ComponentModel.DataAnnotations;

namespace BitShuva.Chavah.Models.Account
{
    /// <summary>
    /// A request to migrate a user's email to a different email address.
    /// </summary>
    public class MigrateUserModel
    {
        /// <summary>
        /// The user's old email from an existing Chavah account.
        /// </summary>
        [Required]
        [EmailAddress]
        public string OldEmail { get; set; } = string.Empty;

        /// <summary>
        /// The new email address to migrate the account to. A user with this email may or may not already exist. If not, one will be created.
        /// </summary>
        [Required()]
        [EmailAddress]
        public string NewEmail { get; set; } = string.Empty;
    }
}
