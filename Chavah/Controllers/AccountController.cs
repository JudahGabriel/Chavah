using BitShuva.Common;
using BitShuva.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.Identity.Owin;
using System.Net.Http;
using System.Web.Http;
using System.Threading.Tasks;
using BitShuva.Services;
using BitShuva.Models.Indexes;
using Raven.Client;

namespace BitShuva.Controllers
{
    [RoutePrefix("api/accounts")]
    [JwtSession]
    public class AccountController : RavenApiController
    {
        private ApplicationSignInManager signInManager;
        private ApplicationUserManager userManager;

        public AccountController()
        {

        }
        
        public ApplicationSignInManager SignInManager
        {
            get
            {
                if (signInManager == null)
                {
                    signInManager = Request.GetOwinContext().Get<ApplicationSignInManager>();
                }

                return signInManager;
            }
        }

        public ApplicationUserManager UserManager
        {
            get
            {
                if (userManager == null)
                {
                    userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
                }

                return userManager;
            }
        }

        [Route("SignIn")]
        [HttpPost]
        public async Task<SignInResult> SignIn(string email, string password, bool staySignedIn)
        {
            // Require the user to have a confirmed email before they can log on.
            var user = await UserManager.FindAsync(email, password);
            if (user == null)
            {
                await ChavahLog.Info(DbSession, "Sign in failed for user " + email + "; bad user name or password.");
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
                await ChavahLog.Info(DbSession, "Sign in failed for user " + email, signInStatus);
            }

            return result;
        }

        [HttpPost]
        [Route("SignOut")]
        public void SignOut()
        {
            Request.GetOwinContext().Authentication.SignOut();
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
            var user = await DbSession.LoadAsync<ApplicationUser>("ApplicationUsers/" + email);
            if (user == null || !user.RequiresPasswordReset || password.Length < 6)
            {
                throw NewUnauthorizedException();
            }

            var userId = "ApplicationUsers/" + email;
            var removePasswordResult = await UserManager.RemovePasswordAsync(userId);
            if (!removePasswordResult.Succeeded)
            {
                throw new Exception("Unable to remove password. " + string.Join(Environment.NewLine, removePasswordResult.Errors));
            }

            var addPasswordResult = await UserManager.AddPasswordAsync(userId, password);
            if (!addPasswordResult.Succeeded)
            {
                throw new Exception("Unable to add password. " + string.Join(Environment.NewLine, addPasswordResult.Errors));
            }
            user.RequiresPasswordReset = false;
            user.IsEmailConfirmed = true;
        }

        [HttpGet]
        [Route("GetUserWithEmail")]
        public async Task<ApplicationUser> GetUserWithEmail(string email)
        {
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

        [HttpPost]
        [Route("Register")]
        public async Task<RegisterResults> Register(string email, string password)
        {
            // See if we're already registered.
            var userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
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
            var user = new ApplicationUser
            {
                Id = "ApplicationUsers/" + email.ToLower(),
                UserName = email,
                Email = email,
                LastSeen = DateTime.UtcNow,
                RegistrationDate = DateTime.UtcNow
            };
            var creteUserResult = await userManager.CreateAsync(user, password);
            if (creteUserResult.Succeeded)
            {
                // Send confirmation email.
                var confirmToken = await userManager.GenerateEmailConfirmationTokenAsync(user.Id);
                await userManager.EmailService.SendAsync(SendGridEmailService.ConfirmEmail(email, confirmToken, Request.RequestUri));
                await ChavahLog.Info(DbSession, $"Sending confirmation email to {email}", new { confirmToken = confirmToken });
                return new RegisterResults
                {
                    Success = true
                };
            }
            else
            {
                // Registration failed.
                await ChavahLog.Warn(DbSession, "Register new user failed.", creteUserResult);
                return new RegisterResults
                {
                    ErrorMessage = string.Join(",", creteUserResult.Errors)
                };
            }
        }

        /// <summary>
        /// Confirms a user's email.
        /// </summary>
        [HttpPost]
        [Route("ConfirmEmail")]
        public async Task<ConfirmEmailResult> ConfirmEmail(string email, string confirmCode)
        {
            var userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();

            // Make sure the user exists.
            var userId = "ApplicationUsers/" + email;
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

            var confirmResult = await userManager.ConfirmEmailAsync(userId, confirmCode);
            if (!confirmResult.Succeeded)
            {
                await ChavahLog.Error(DbSession, $"Unable to confirm email {email} using confirm code {confirmCode}", string.Join(",", confirmResult.Errors), confirmResult);
            }

            await ChavahLog.Info(DbSession, $"Successfully confirmed new account for {email}");
            return new ConfirmEmailResult
            {
                Success = confirmResult.Succeeded,
                ErrorMessage = string.Join(",", confirmResult.Errors)
            };
        }

        /// <summary>
        /// Begins the password reset process by generating a password reset token and sending the user an email with the link to reset the password.
        /// </summary>
        [HttpPost]
        [Route("SendResetPasswordEmail")]
        public async Task<ResetPasswordResult> SendResetPasswordEmail(string email)
        {
            var userId = "ApplicationUsers/" + email.ToLower();
            var user = await DbSession.LoadAsync<ApplicationUser>(userId);
            if (user == null)
            {
                await ChavahLog.Warn(DbSession, $"Tried to reset password for {email}, but couldn't find user with that email.");
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email",
                    InvalidEmail = true
                };
            }

            var userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var passwordResetCode = await userManager.GeneratePasswordResetTokenAsync(userId);
            var mailMessage = SendGridEmailService.ResetPassword(email, passwordResetCode, Request.RequestUri);
            await userManager.SendEmailAsync(userId, mailMessage.Subject, mailMessage.Body);

            await ChavahLog.Info(DbSession, $"Sending reset password email to {email}, reset code {passwordResetCode}");
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
        [HttpPost]
        [Route("ResetPassword")]
        public async Task<ResetPasswordResult> ResetPassword(string email, string passwordResetCode, string newPassword)
        {
            var userId = "ApplicationUsers/" + email.ToLower();
            var user = await DbSession.LoadAsync<ApplicationUser>(userId);
            if (user == null)
            {
                await ChavahLog.Warn(DbSession, $"Attempted to reset password {email}, but couldn't find a user with that email.");
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email"
                };
            }

            var userManager = Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var passwordResetResult = await userManager.ResetPasswordAsync(userId, passwordResetCode, newPassword);

            if (!passwordResetResult.Succeeded)
            {
                await ChavahLog.Warn(DbSession, $"Unable to reset password for {email} using code {passwordResetCode}", passwordResetResult);
            }

            return new ResetPasswordResult
            {
                Success = passwordResetResult.Succeeded,
                ErrorMessage = string.Join(",", passwordResetResult.Errors)
            };
        }
    }
}