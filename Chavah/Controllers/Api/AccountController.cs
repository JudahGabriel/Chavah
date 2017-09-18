using BitShuva.Common;
using BitShuva.Models;
using System;
using System.Web;
using Microsoft.AspNet.Identity.Owin;
using System.Net.Http;
using System.Web.Http;
using System.Threading.Tasks;
using BitShuva.Services;
using BitShuva.Interfaces;
using System.Collections.Generic;
using Optional;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/accounts")]
    [JwtSession]
    public class AccountController : RavenApiController
    {
        private readonly ApplicationUserManager UserManager;
        private readonly ApplicationSignInManager SignInManager;

        public AccountController(ApplicationUserManager userManager, 
                                 ApplicationSignInManager signInManager,
                                 ILoggerService logger) : base(logger)
        {
            this.UserManager = userManager;
            this.SignInManager = signInManager;
            //this.authenticationManager = authenticationManager;

            //logger serivce
            //_logger = logger;
        }

        [Route("SignIn")]
        [HttpPost]
        public async Task<SignInResult> SignIn(string email, string password, bool staySignedIn)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                return new SignInResult
                {
                    ErrorMessage = "Bad user name or password",
                    Status = SignInStatus.Failure
                };
            }

            // Require the user to have a confirmed email before they can log on.
            var user = await UserManager.FindAsync(email, password);
            if (user == null)
            {
                await _logger.Info($"Sign in failed; bad user name or password", email);
                //await ChavahLog.Info(DbSession, "Sign in failed for user " + email + "; bad user name or password.");
                return new SignInResult
                {
                    ErrorMessage = "Bad user name or password",
                    Status = SignInStatus.Failure
                };
            }

            var isEmailConfirmed = await UserManager.IsEmailConfirmedAsync(user.Id);
            if (!isEmailConfirmed)
            {
                return new SignInResult
                {
                    Status = SignInStatus.RequiresVerification
                };
            }

            var jsonWebTokenExpiration = staySignedIn ? DateTime.UtcNow.AddDays(365) : DateTime.UtcNow.AddDays(1);
            var jsonWebToken = new JsonWebTokenService().WriteToken(user.Email, user.IsAdmin(), jsonWebTokenExpiration);
            var signInStatus = await SignInManager.PasswordSignInAsync(email, password, staySignedIn, shouldLockout: false);

            var result = new SignInResult
            {
                Status = signInStatus,
                JsonWebToken = signInStatus == SignInStatus.Success ? jsonWebToken : null,
                Email = user.Email,
                Roles = user.Roles
            };

            // If we've successfully signed in, store the json web token in the user.
            if (signInStatus == SignInStatus.Success)
            {
                user.Jwt = jsonWebToken;
            }
            else
            {
                await _logger.Info($"Sign in failed", result);
                //await ChavahLog.Info(DbSession, "Sign in failed for user " + email, signInStatus);
            }

            return result;
        }

        [Route("SignOut")]
        [HttpPost]
        public void SignOut()
        {
            SignInManager.AuthenticationManager.SignOut();
            //Request.GetOwinContext().Authentication.SignOut();
        }

        /// <summary>
        /// This is used for migrating old users into the new system. The old users were imported without passwords.
        /// When such a user signs in, we prompt them to create a password.
        /// </summary>
        /// <param name="email"></param>
        /// <param name="password"></param>
        /// <returns></returns>
        [Route("CreatePassword")]
        public async Task CreatePassword(string email, string password)
        {
            // Find the user with that email.
            await _logger.Info("Migrating user from old system", email);
            var user = await DbSession.LoadAsync<ApplicationUser>("ApplicationUsers/" + email);
            if (user == null || !user.RequiresPasswordReset || password.Length < 6)
            {
                throw NewUnauthorizedException();
            }

            var userId = "ApplicationUsers/" + email;
            var removePasswordResult = await UserManager.RemovePasswordAsync(userId);
            if (!removePasswordResult.Succeeded)
            {
                var errorMessage = "CreatePassword failed because we couldn't remove the old password.";
                await _logger.Warn(errorMessage, removePasswordResult);
                throw new Exception(errorMessage);
            }

            var addPasswordResult = await UserManager.AddPasswordAsync(userId, password);
            if (!addPasswordResult.Succeeded)
            {
                string error = $"Unable to set the new password for the user.";
                await _logger.Warn(error, addPasswordResult);
                throw new Exception(error);
            }
            user.RequiresPasswordReset = false;
            user.IsEmailConfirmed = true;
        }

        [Route("GetUserWithEmail")]
        [HttpGet]
        public async Task<ApplicationUser> GetUserWithEmail(string email)
        {
            //TODO: have POCO object to be send back to the app requester
            var user = await DbSession.LoadAsync<ApplicationUser>("ApplicationUsers/" + email);
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
            var existingUser = await UserManager.FindByEmailAsync(email.ToLower());
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
            var user = new ApplicationUser
            {
                Id = "ApplicationUsers/" + emailLower,
                UserName = email,
                Email = email,
                LastSeen = DateTime.UtcNow,
                RegistrationDate = DateTime.UtcNow
            };
            var creteUserResult = await UserManager.CreateAsync(user, password);
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

                await UserManager.EmailService.SendAsync(SendGridEmailService.ConfirmEmail(email, confirmToken.Token, Request.RequestUri));

                await _logger.Info($"Sending new user confirmation email", (Email: email, ConfirmToken: confirmToken.Token));
                //await ChavahLog.Info(DbSession, $"Sending confirmation email to {email}", new { confirmToken = confirmToken });
                return new RegisterResults
                {
                    Success = true
                };
            }
            else
            {
                // Registration failed.
                await _logger.Warn("Register new user failed.", creteUserResult);
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
            var user = await DbSession.LoadAsync<ApplicationUser>(userId);
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
                await _logger.Info("Successfully confirmed new account", email);

                // Add a welcome notification for the user.
                user.AddNotification(Notification.Welcome());
            }
            else if (!regToken.HasValue)
            {
                errorMessage = "Tried to confirm email, but couldn't find the registration token for this user.";
                await _logger.Warn(errorMessage, regTokenId);
            }
            else if (!isSameCode)
            {
                errorMessage = "Tried to confirm email, but the confirmation code was wrong.";
                await _logger.Warn(errorMessage, (expected: regToken.FlatMap(t => t.Token).ValueOr(""), actual: confirmCode));
            }
            else
            {
                errorMessage = "Tried to confirm email, but the confirmation code was for an incorrect user.";
                await _logger.Error(errorMessage, null, (expected: regToken.FlatMap(t => t.ApplicationUserId).ValueOr(""), actual: email));
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
            var user = await DbSession.LoadAsync<ApplicationUser>(userId);
            if (user == null)
            {
                await _logger.Warn($"Tried to reset password, but couldn't find user with that email.", email);
                //await ChavahLog.Warn(DbSession, $"Tried to reset password for {email}, but couldn't find user with that email.");
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email",
                    InvalidEmail = true
                };
            }

            //var userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var passwordResetCode = await UserManager.GeneratePasswordResetTokenAsync(userId);
            var mailMessage = SendGridEmailService.ResetPassword(email, passwordResetCode, Request.RequestUri);
            await UserManager.SendEmailAsync(userId, mailMessage.Subject, mailMessage.Body);

            await _logger.Info($"Sending reset password email", (Email: email, ResetCode: passwordResetCode));
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
            var user = await DbSession.LoadAsync<ApplicationUser>(userId);
            if (user == null)
            {
                await _logger.Warn($"Attempted to reset password, but couldn't find a user with that email", email);
                //await ChavahLog.Warn(DbSession, $"Attempted to reset password {email}, but couldn't find a user with that email.");
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email"
                };
            }

            //var userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var passwordResetResult = await UserManager.ResetPasswordAsync(userId, passwordResetCode, newPassword);

            if (!passwordResetResult.Succeeded)
            {
                await _logger.Warn($"Unable to reset password", (Email: email, Code: passwordResetCode, Errors: string.Join(", ", passwordResetResult.Errors)));
            }

            return new ResetPasswordResult
            {
                Success = passwordResetResult.Succeeded,
                ErrorMessage = string.Join(",", passwordResetResult.Errors)
            };
        }
    }
}