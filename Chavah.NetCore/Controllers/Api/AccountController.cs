using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers.Api
{
    public class AccountController : RavenController
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ILogger<AccountController> _logger;
        private readonly IConfiguration _config;

        public AccountController(
                            IAsyncDocumentSession dbSession,
                            UserManager<AppUser> userManager,
                            SignInManager<AppUser> signInManager,
                            //IEmailSender emailSender,
                            ILogger<AccountController> logger,
                            IConfiguration config) : base(dbSession)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            //_emailSender = emailSender;
            _logger = logger;
            _config = config;

        }
        /// <summary>
        /// Confirms a user's email.
        /// </summary>
        [Route("ConfirmEmail")]
        [HttpPost]
        public async Task<ConfirmEmailResult> ConfirmEmail(string email, string confirmCode)
        {
            // Make sure the user exists.
            var emailLower = email.ToLowerInvariant();
            var userId = "ApplicationUsers/" + emailLower;
            var user = await DbSession.LoadAsync<AppUser>(userId);
            if (user == null)
            {
                return new ConfirmEmailResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find a user with that email."
                };
            }

            // We've seen some users click the confirm link multiple times.
            // If the user is already confirmed, just play along and say it's ok.
            if (user.IsEmailConfirmed)
            {
                return new ConfirmEmailResult
                {
                    Success = true
                };
            }
            var regTokenId = $"AccountTokens/Confirm/{emailLower}";
            var regToken = await DbSession.LoadOptionAsync<AccountToken>(regTokenId);
            var isSameCode = regToken.Map(t => string.Equals(t.Token, confirmCode, StringComparison.InvariantCultureIgnoreCase)).ValueOr(false);
            var isSameUser = regToken.Map(t => string.Equals(t.ApplicationUserId, userId, StringComparison.InvariantCultureIgnoreCase)).ValueOr(false);
            var isValidToken = isSameCode && isSameUser;
            var errorMessage = default(string);
            if (isValidToken)
            {
                user.IsEmailConfirmed = true;
                 _logger.LogInformation($"Successfully confirmed new account {email}");

                // Add a welcome notification for the user.
                user.AddNotification(Notification.Welcome());
            }
            else if (!regToken.HasValue)
            {
                errorMessage = "Tried to confirm email, but couldn't find the registration token for this user.";
                _logger.LogWarning($"{errorMessage} { regTokenId}");
            }
            else if (!isSameCode)
            {
                errorMessage = "Tried to confirm email, but the confirmation code was wrong.";
                _logger.LogWarning(errorMessage, (expected: regToken.FlatMap(t => t.Token).ValueOr(""), actual: confirmCode));
            }
            else
            {
                errorMessage = "Tried to confirm email, but the confirmation code was for an incorrect user.";
                _logger.LogWarning(errorMessage, null, (expected: regToken.FlatMap(t => t.ApplicationUserId).ValueOr(""), actual: email));
            }

            return new ConfirmEmailResult
            {
                Success = isValidToken,
                ErrorMessage = errorMessage
            };
        }

        /// <summary>
        /// Resets the user's password using the email and password reset code.
        /// </summary>
        [Route("ResetPassword")]
        [HttpPost]
        public async Task<ResetPasswordResult> ResetPassword(string email, string passwordResetCode, string newPassword)
        {
            var userId = "ApplicationUsers/" + email.ToLower();
            var user = await DbSession.LoadAsync<AppUser>(userId);
            if (user == null)
            {
                _logger.LogWarning($"Attempted to reset password, but couldn't find a user with that email", email);
                //await ChavahLog.Warn(DbSession, $"Attempted to reset password {email}, but couldn't find a user with that email.");
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email"
                };
            }

            var passwordResetResult = await _userManager.ResetPasswordAsync(user, passwordResetCode, newPassword);

            if (!passwordResetResult.Succeeded)
            {
                _logger.LogWarning($"Unable to reset password", (Email: email, Code: passwordResetCode, Errors: string.Join(", ", passwordResetResult.Errors)));
            }

            return new ResetPasswordResult
            {
                Success = passwordResetResult.Succeeded,
                ErrorMessage = string.Join(",", passwordResetResult.Errors)
            };
        }
    }
}
