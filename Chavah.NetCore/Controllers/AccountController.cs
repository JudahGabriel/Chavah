using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]")]
    public class AccountController : RavenController
    {
        private readonly UserManager<AppUser> userManager;
        private readonly SignInManager<AppUser> signInManager;

        public AccountController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            IAsyncDocumentSession dbSession, 
            ILogger<AccountController> logger) 
            : base(dbSession, logger)
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
        }

        [HttpPost]
        public async Task<Models.SignInResult> SignIn(string email, string password, bool staySignedIn)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                return new Models.SignInResult
                {
                    ErrorMessage = "Bad user name or password",
                    Status = SignInStatus.Failure
                };
            }

            // Require the user to have a confirmed email before they can log on.
            var user = await userManager.FindByEmailAsync(email);
            var isCorrectPassword = false;
            if (user != null)
            {
                isCorrectPassword = await userManager.CheckPasswordAsync(user, password);
            }

            if (user == null || !isCorrectPassword)
            {
                logger.LogInformation("Sign in failed; bad user name or password {email}", email);
                return new Models.SignInResult
                {
                    ErrorMessage = "Bad user name or password",
                    Status = SignInStatus.Failure
                };
            }

            var isEmailConfirmed = await userManager.IsEmailConfirmedAsync(user);
            if (!isEmailConfirmed)
            {
                return new Models.SignInResult
                {
                    Status = SignInStatus.RequiresVerification
                };
            }
            
            var signInResult = await signInManager.PasswordSignInAsync(email, password, staySignedIn, lockoutOnFailure: false);
            var result = new Models.SignInResult
            {
                Status = SignInStatusFromResult(signInResult),
                Email = user.Email,
                Roles = new List<string>(user.Roles)
            };

            // If we've successfully signed in, store the json web token in the user.
            if (result.Status != SignInStatus.Success)
            {
                logger.LogInformation("Sign in failed with {result}", result);
            }

            return result;
        }

        [HttpPost]
        public Task SignOut()
        {
            return signInManager.SignOutAsync();
        }

        /// <summary>
        /// This is used for migrating old users into the new system. The old users were imported without passwords.
        /// When such a user signs in, we prompt them to create a password.
        /// </summary>
        /// <param name="email"></param>
        /// <param name="password"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task CreatePassword(string email, string password)
        {
            // Find the user with that email.
            logger.LogInformation("Migrating user {email} from old system", email);
            var user = await DbSession.LoadAsync<AppUser>("AppUsers/" + email);
            if (user == null || !user.RequiresPasswordReset || password.Length < 6)
            {
                throw new UnauthorizedAccessException();
            }

            var userId = "ApplicationUsers/" + email;
            var removePasswordResult = await userManager.RemovePasswordAsync(user);
            if (!removePasswordResult.Succeeded)
            {
                var errorMessage = "CreatePassword failed because we couldn't remove the old password.";
                logger.LogWarning(errorMessage + "{result}", removePasswordResult);
                throw new Exception(errorMessage);
            }

            var addPasswordResult = await userManager.AddPasswordAsync(user, password);
            if (!addPasswordResult.Succeeded)
            {
                string error = "Unable to set the new password for the user.";
                logger.LogWarning(error + " {result}", addPasswordResult);
                throw new Exception(error);
            }

            user.RequiresPasswordReset = false;
            user.IsEmailConfirmed = true;
        }
        
        [HttpGet]
        public async Task<AppUser> GetUserWithEmail(string email)
        {
            //TODO: have POCO object to be send back to the app requester
            var user = await DbSession.LoadAsync<AppUser>("ApplicationUsers/" + email);
            if (user != null)
            {
                // Remove the user from the session, as we're going to clear out the password hash for security reasons before sending it to the user.
                DbSession.Advanced.Evict(user);
                user.PasswordHash = "";
                user.SecurityStamp = "";
            }

            return user;           
        }

        [Route("ClearNotifications")]
        [HttpPost]
        public async Task<int> ClearNotifications()
        {
            var user = await this.GetCurrentUser();
            if (user != null)
            {
                var count = user.Notifications.Count;
                user.Notifications.ForEach(n => n.IsUnread = false);

                return count;
            }

            return 0;
        }

        [Route("Register")]
        [HttpPost]
        [AllowAnonymous]
        public async Task<RegisterResults> Register(string email, string password)
        {
            // See if we're already registered.
            var existingUser = await userManager.FindByEmailAsync(email.ToLower());
            if (existingUser != null)
            {
                return new RegisterResults
                {
                    ErrorMessage = "You're already registered.",
                    IsAlreadyRegistered = true,
                    NeedsConfirmation = !existingUser.IsEmailConfirmed
                };
            }

            // The user doesn't exist yet. Try and register him.
            var emailLower = email.ToLowerInvariant();
            var user = new AppUser
            {
                Id = "ApplicationUsers/" + emailLower,
                UserName = email,
                Email = email,
                LastSeen = DateTime.UtcNow,
                RegistrationDate = DateTime.UtcNow
            };
            var creteUserResult = await userManager.CreateAsync(user, password);
            if (creteUserResult.Succeeded)
            {
                // Send confirmation email.
                var confirmToken = new AccountToken //await UserManager.GenerateEmailConfirmationTokenAsync(user.Id);
                {
                    Id = $"AccountTokens/Confirm/{emailLower}",
                    ApplicationUserId = user.Id,
                    Token = Guid.NewGuid().ToString()
                };
                await DbSession.StoreAsync(confirmToken);
                DbSession.SetRavenExpiration(confirmToken, DateTime.UtcNow.AddDays(14));

                await userManager.EmailService.SendAsync(SendGridEmailService.ConfirmEmail(email, confirmToken.Token, Request.RequestUri));

                logger.LogInformation($"Sending new user confirmation email", (Email: email, ConfirmToken: confirmToken.Token));
                //await ChavahLog.Info(DbSession, $"Sending confirmation email to {email}", new { confirmToken = confirmToken });
                return new RegisterResults
                {
                    Success = true
                };
            }
            else
            {
                // Registration failed.
                logger.LogWarning("Register new user failed.", creteUserResult);
                //await ChavahLog.Warn(DbSession, "Register new user failed.", creteUserResult);
                return new RegisterResults
                {
                    ErrorMessage = string.Join(",", creteUserResult.Errors)
                };
            }
        }

        /// <summary>
        /// Confirms a user's email.
        /// </summary>
        [Route("ConfirmEmail")]
        [HttpPost]
        public async Task<ConfirmEmailResult> ConfirmEmail(string email, string confirmCode)
        {
            //var userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();

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
                logger.LogInformation("Successfully confirmed new account", email);

                // Add a welcome notification for the user.
                user.AddNotification(Notification.Welcome());
            }
            else if (!regToken.HasValue)
            {
                errorMessage = "Tried to confirm email, but couldn't find the registration token for this user.";
                logger.LogWarning(errorMessage, regTokenId);
            }
            else if (!isSameCode)
            {
                errorMessage = "Tried to confirm email, but the confirmation code was wrong.";
                logger.LogWarning(errorMessage, (expected: regToken.FlatMap(t => t.Token).ValueOr(""), actual: confirmCode));
            }
            else
            {
                errorMessage = "Tried to confirm email, but the confirmation code was for an incorrect user.";
                logger.LogError(errorMessage, null, (expected: regToken.FlatMap(t => t.ApplicationUserId).ValueOr(""), actual: email));
            }

            //var confirmResult = await UserManager.ConfirmEmailAsync(userId, confirmCode);
            //if (!confirmResult.Succeeded)
            //{
            //    await _logger.Error("Unable to confirm email", null, (Email: email, ConfirmCode: confirmCode, Result: string.Join(", ", confirmResult.Errors)));
            //}

            return new ConfirmEmailResult
            {
                Success = isValidToken,
                ErrorMessage = errorMessage
            };
        }

        /// <summary>
        /// Begins the password reset process by generating a password reset token and sending the user an email with the link to reset the password.
        /// </summary>
        [Route("SendResetPasswordEmail")]
        [HttpPost]
        public async Task<ResetPasswordResult> SendResetPasswordEmail(string email)
        {
            var userId = "ApplicationUsers/" + email.ToLower();
            var user = await DbSession.LoadAsync<AppUser>(userId);
            if (user == null)
            {
                logger.LogWarning($"Tried to reset password, but couldn't find user with that email.", email);
                //await ChavahLog.Warn(DbSession, $"Tried to reset password for {email}, but couldn't find user with that email.");
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email",
                    InvalidEmail = true
                };
            }

            //var userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var passwordResetCode = await userManager.GeneratePasswordResetTokenAsync(user);
            var mailMessage = SendGridEmailService.ResetPassword(email, passwordResetCode, Request.RequestUri);
            await userManager.SendEmailAsync(userId, mailMessage.Subject, mailMessage.Body);

            logger.LogInformation($"Sending reset password email", (Email: email, ResetCode: passwordResetCode));
            return new ResetPasswordResult
            {
                Success = true,
                ErrorMessage = "",
                InvalidEmail = false
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
                logger.LogWarning($"Attempted to reset password, but couldn't find a user with that email", email);
                //await ChavahLog.Warn(DbSession, $"Attempted to reset password {email}, but couldn't find a user with that email.");
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email"
                };
            }

            //var userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var passwordResetResult = await userManager.ResetPasswordAsync(user, passwordResetCode, newPassword);

            if (!passwordResetResult.Succeeded)
            {
               logger.LogWarning($"Unable to reset password", (Email: email, Code: passwordResetCode, Errors: string.Join(", ", passwordResetResult.Errors)));
            }

            return new ResetPasswordResult
            {
                Success = passwordResetResult.Succeeded,
                ErrorMessage = string.Join(",", passwordResetResult.Errors)
            };
        }

        private SignInStatus SignInStatusFromResult(Microsoft.AspNetCore.Identity.SignInResult result)
        {
            if (result.Succeeded)
            {
                return SignInStatus.Success;
            }

            if (result.IsLockedOut)
            {
                return SignInStatus.LockedOut;
            }

            return SignInStatus.Failure;
        }
    }
}