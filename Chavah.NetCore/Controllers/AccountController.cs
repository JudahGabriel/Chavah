using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

using AutoMapper;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Account;
using BitShuva.Chavah.Settings;
using BitShuva.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Pwned.AspNetCore;

using Raven.Client.Documents.Session;
using Raven.StructuredLog;

namespace BitShuva.Chavah.Controllers
{
    [ApiVersion("1.0")]
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class AccountController : RavenController
    {
        private readonly UserManager<AppUser> userManager;
        private readonly SignInManager<AppUser> signInManager;
        private readonly IEmailService emailSender;
        private readonly AppSettings appOptions;
        private readonly EmailSettings emailOptions;
        private readonly IMapper mapper;
        private readonly IPwnedPasswordService pwnedPasswordService;

        private const string PwnedPasswordMessage = "Select a different password because the password you chose has appeared in a data breach {0} times.";

        public AccountController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            IAsyncDocumentSession asyncDocumentSession,
            ILogger<AccountController> logger,
            IEmailService emailSender,
            IOptionsMonitor<AppSettings> appOptions,
            IOptionsMonitor<EmailSettings> emailOptions,
            IMapper mapper,
            IPwnedPasswordService pwnedPasswordService)
            : base(asyncDocumentSession, logger)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
            this.emailSender = emailSender;
            this.appOptions = appOptions.CurrentValue;
            this.mapper = mapper;
            this.pwnedPasswordService = pwnedPasswordService;
            this.emailOptions = emailOptions.CurrentValue;
        }

        ///// <summary>
        ///// Returns currently logged in user.
        ///// </summary>
        ///// <returns code="200">Returns logged in user.</returns>
        //[HttpGet]
        //[ProducesResponseType(typeof(UserViewModel), (int)HttpStatusCode.OK)]
        //[ProducesResponseType(typeof(void), (int)HttpStatusCode.NoContent)]
        //public async Task<IActionResult> GetUser()
        //{
        //    var userName = User.Identity.Name;
        //    AppUser user = null;
        //    if (!string.IsNullOrEmpty(userName))
        //    {
        //        user = await base.GetUser().ConfigureAwait(false);
        //        return Ok(mapper.Map<UserViewModel>(user));
        //    }
        //    return Ok(null);
        //}

        /// <summary>
        /// User SignIn.
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [ProducesResponseType(typeof(SignInModel), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(void), (int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> SignIn([BindRequired, FromBody, FromForm]SignInModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Email)
                || string.IsNullOrWhiteSpace(model.Password))
            {
                logger.LogInformation("Sign-in failed due to empty {email} or {password}", model.Email, model.Password);
                return Ok(new Models.Account.SignInResult
                {
                    ErrorMessage = "Bad user name or password",
                    Status = SignInStatus.Failure
                });
            }

            // Require the user to have a confirmed email before they can log on.
            var user = await userManager.FindByEmailAsync(model.Email).ConfigureAwait(false);

            var isCorrectPassword = false;
            if (user != null)
            {
                isCorrectPassword = await userManager.CheckPasswordAsync(user, model.Password).ConfigureAwait(false);
            }

            if (user == null
                || !isCorrectPassword)
            {
                logger.LogInformation("Sign in failed; bad user name or password {email}", model.Email);
                return Ok(new Models.Account.SignInResult
                {
                    ErrorMessage = "Bad user name or password",
                    Status = SignInStatus.Failure
                });
            }

            var isEmailConfirmed = await userManager.IsEmailConfirmedAsync(user).ConfigureAwait(false);
            if (!isEmailConfirmed)
            {
                return Ok(new Models.Account.SignInResult
                {
                    Status = SignInStatus.RequiresVerification
                });
            }

            var signInResult = await signInManager.PasswordSignInAsync(
                                        model.Email,
                                        model.Password,
                                        model.StaySignedIn,
                                        lockoutOnFailure: false).ConfigureAwait(false);

            var result = new Models.Account.SignInResult
            {
                Status = SignInStatusFromResult(signInResult, model.Email),
                User = mapper.Map<UserViewModel>(user)
            };

            // If we've successfully signed in, store the json web token in the user.
            if (result.Status != SignInStatus.Success)
            {
                logger.LogInformation("Sign in failed with {status}: {errorMessage}", result.Status, result.ErrorMessage);
            }

            return Ok(result);
        }

        /// <summary>
        /// SingOut from the app.
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public new async Task SignOut()
        {
            await signInManager.SignOutAsync().ConfigureAwait(false);
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

            var userId = $"AppUsers/{email}";

            var user = await DbSession.LoadAsync<AppUser>(userId).ConfigureAwait(false);

            if (user?.RequiresPasswordReset != true
                || password.Length < 6
                || !password.Any(c => char.IsDigit(c)))
            {
                throw new UnauthorizedAccessException();
            }

            var removePasswordResult = await userManager.RemovePasswordAsync(user).ConfigureAwait(false);
            if (!removePasswordResult.Succeeded)
            {
                throw new InvalidOperationException("CreatePassword failed because we couldn't remove the old password.")
                    .WithData("result", string.Join(", ", removePasswordResult.Errors.Select(e => e.Description)));
            }

            var addPasswordResult = await userManager.AddPasswordAsync(user, password).ConfigureAwait(false);
            if (!addPasswordResult.Succeeded)
            {
                throw new InvalidOperationException("Unable to set the new password for the user.")
                    .WithData("result", string.Join(", ", addPasswordResult.Errors.Select(e => e.Description)));
            }

            user.RequiresPasswordReset = false;
            user.EmailConfirmed = true;
        }

        /// <summary>
        /// Return User View Model.
        /// </summary>
        /// <param name="email"></param>
        /// <returns></returns>
        [HttpGet]
        [ProducesResponseType(typeof(UserViewModel), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(void), (int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> GetUserWithEmail(string email)
        {
            var userId = $"AppUsers/{email}";

            var user = await DbSession.LoadAsync<AppUser>(userId).ConfigureAwait(false);
            if (user != null)
            {
                // Remove the user from the session, as we're going to clear out the password hash for security reasons before sending it to the user.
                DbSession.Advanced.Evict(user);
            }

            return Ok(mapper.Map<UserViewModel>(user));
        }

        /// <summary>
        /// Clear Notifications for the authorized user.
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public async Task<int> ClearNotifications()
        {
            var user = await GetUserOrThrow().ConfigureAwait(false);
            var count = user.Notifications.Count;

            user.Notifications.ForEach(n => n.IsUnread = false);

            return count;
        }

        /// <summary>
        /// Register a new user.
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [AllowAnonymous]
        [ProducesResponseType(typeof(RegisterResults), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Register([BindRequired,FromBody, FromForm]RegisterModel model)
        {
            var (pwned, count) = await pwnedPasswordService.IsPasswordPwnedAsync(model.Password).ConfigureAwait(false);

            if (pwned)
            {
                return Ok(new RegisterResults
                {
                    IsPwned = true,
                    ErrorMessage = string.Format(PwnedPasswordMessage,count),
                });
            }

            // See if we're already registered.
            var emailLower = model.Email.ToLowerInvariant();
            var existingUser = await userManager.FindByEmailAsync(emailLower).ConfigureAwait(false);
            if (existingUser != null)
            {
                return Ok(new RegisterResults
                {
                    ErrorMessage = "You're already registered.",
                    IsAlreadyRegistered = true,
                    NeedsConfirmation = !existingUser.EmailConfirmed
                });
            }

            // Reject throwaway emails. We need to do this because this helps prevent upvote/downvote fraud.
            var throwawayDomainsDoc = await DbSession.LoadOptionalAsync<ThrowawayEmailDomains>("ThrowawayEmailDomains/1");
            var attemptedDomain = emailLower.Substring(emailLower.LastIndexOf('@') + 1);
            var isThrowawayEmail = throwawayDomainsDoc?.Domains.Contains(attemptedDomain, StringComparison.InvariantCultureIgnoreCase);
            if (isThrowawayEmail == true)
            {
                logger.LogInformation("Rejected attempt to register with a throwaway email address {email}", emailLower);
                return Ok(new RegisterResults
                {
                    ErrorMessage = "Throwaway email accounts are unable to register with Chavah. Please use a valid email address. We'll never send spam nor share your email with anyone."
                });
            }

            // The user doesn't exist yet. Try and register him.
            var user = new AppUser
            {
                Id = $"AppUsers/{emailLower}",
                UserName = model.Email,
                Email = model.Email,
                LastSeen = DateTime.UtcNow,
                RegistrationDate = DateTime.UtcNow
            };
            var createUserResult = await userManager.CreateAsync(user, model.Password).ConfigureAwait(false);
            if (createUserResult.Succeeded)
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

                emailSender.QueueConfirmEmail(model.Email, confirmToken.Token, appOptions);

                logger.LogInformation("Sending new user confirmation email to {email} with confirm token {token}", model.Email, confirmToken.Token);
                return Ok(new RegisterResults
                {
                    Success = true
                });
            }
            else
            {
                // Registration failed.
                logger.LogWarning("Register new user failed with {result}", createUserResult);
                return Ok(new RegisterResults
                {
                    ErrorMessage = string.Join(", ", createUserResult.Errors.Select(s => s.Description))
                });
            }
        }

        /// <summary>
        /// Confirms a user's email.
        /// </summary>
        /// <param name="email"></param>
        /// <param name="confirmCode"></param>
        [HttpPost]
        public async Task<ConfirmEmailResult> ConfirmEmail(string email, string confirmCode)
        {
            // Make sure the user exists.
            var userId = $"AppUsers/{email.ToLowerInvariant()}";

            var user = await DbSession.LoadAsync<AppUser>(userId).ConfigureAwait(false);
            if (user == null)
            {
                logger.LogInformation("Rejected email confirmation because couldn't find {userId}", userId);
                return new ConfirmEmailResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find a user with that email."
                };
            }

            // We've seen some users click the confirm link multiple times.
            // If the user is already confirmed, just play along and say it's ok.
            if (user.EmailConfirmed)
            {
                return new ConfirmEmailResult
                {
                    Success = true
                };
            }

            var regTokenId = $"AccountTokens/Confirm/{email.ToLowerInvariant()}";
            var regToken = await DbSession.LoadOptionalAsync<AccountToken>(regTokenId).ConfigureAwait(false);
            var isSameCode = regToken != null && string.Equals(regToken.Token, confirmCode, StringComparison.InvariantCultureIgnoreCase);
            var isSameUser = regToken != null && string.Equals(regToken.ApplicationUserId, userId, StringComparison.InvariantCultureIgnoreCase);
            var isValidToken = isSameCode && isSameUser;
            var errorMessage = default(string);
            if (isValidToken)
            {
                user.EmailConfirmed = true;
                logger.LogInformation("Successfully confirmed new account", email);

                // Add a welcome notification for the user.
                user.AddNotification(Notification.Welcome(appOptions.AuthorImageUrl));

                // Send them a welcome email.
                emailSender.QueueWelcomeEmail(email);
            }
            else if (regToken == null)
            {
                using (logger.BeginKeyValueScope("tokenId", regTokenId))
                {
                    errorMessage = "Tried to confirm email, but couldn't find the registration token for this user.";
                    logger.LogWarning(errorMessage);
                }
            }
            else if (!isSameCode)
            {
                using (logger.BeginKeyValueScope("regToken", regToken))
                using (logger.BeginKeyValueScope("confirmCode", confirmCode))
                {
                    errorMessage = "Tried to confirm email, but the confirmation code was wrong.";
                    logger.LogWarning(errorMessage);
                }
            }
            else
            {
                using (logger.BeginKeyValueScope("regToken", regToken))
                using (logger.BeginKeyValueScope("email", email))
                {
                    errorMessage = "Tried to confirm email, but the confirmation code was for an incorrect user.";
                    logger.LogError(errorMessage);
                }
            }

            if (!isValidToken)
            {
                logger.LogInformation("Rejected email confirmation. {errorMessage}", errorMessage);
            }

            return new ConfirmEmailResult
            {
                Success = isValidToken,
                ErrorMessage = errorMessage
            };
        }

        /// <summary>
        /// Begins the password reset process by generating a password reset token and sending the user an email with the link to reset the password.
        /// </summary>
        /// <param name="email"></param>
        [HttpPost]
        public async Task<ResetPasswordResult> SendResetPasswordEmail(string email)
        {
            var userId = $"AppUsers/{email.ToLower()}";

            var user = await DbSession.LoadAsync<AppUser>(userId).ConfigureAwait(false);
            if (user == null)
            {
                logger.LogWarning("Tried to reset password, but couldn't find user with {email}.", email);
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email",
                    InvalidEmail = true
                };
            }

            var passwordResetToken = new AccountToken //await userManager.GeneratePasswordResetTokenAsync(user);
            {
                ApplicationUserId = userId,
                Id = $"AccountTokens/Reset/{user.Email}",
                Token = Guid.NewGuid().ToString()
            };
            await DbSession.StoreAsync(passwordResetToken);
            DbSession.SetRavenExpiration(passwordResetToken, DateTime.UtcNow.AddDays(14));

            emailSender.QueueResetPassword(email, passwordResetToken.Token, appOptions);

            logger.LogInformation("Sending reset password email to {email} with reset code {resetCode}", email, passwordResetToken.Token);
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
        /// <param name="email"></param>
        /// <param name="passwordResetCode"></param>
        /// <param name="newPassword"></param>
        [HttpPost]
        public async Task<ResetPasswordResult> ResetPassword(string email, string passwordResetCode, string newPassword)
        {
            var userId = $"AppUsers/{email.ToLower()}";

            var user = await DbSession.LoadAsync<AppUser>(userId).ConfigureAwait(false);
            if (user == null)
            {
                logger.LogWarning("Attempted to reset password, but couldn't find a user with {email}", email);
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find user with email"
                };
            }

            // Find the reset token.
            var resetTokenId = $"AccountTokens/Reset/{user.Email}";
            var resetToken = await DbSession.LoadAsync<AccountToken>(resetTokenId).ConfigureAwait(false);
            if (resetToken == null)
            {
                logger.LogWarning("Attempted to reset password for {email}, but couldn't find password reset token {tokenId}", user.Email, resetTokenId);
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Couldn't find a password reset token for your user"
                };
            }

            // Verify the token is good.
            var isValidToken = string.Equals(resetToken.Token, passwordResetCode, StringComparison.InvariantCultureIgnoreCase);
            if (!isValidToken)
            {
                logger.LogWarning("Attempted to reset password for {email}, but the reset token was invalid. Expected {token} but found {invalidToken}", user.Email, resetToken.Token, passwordResetCode);
                return new ResetPasswordResult
                {
                    Success = false,
                    ErrorMessage = "Invalid password reset token"
                };
            }

            var tempResetToken = await userManager.GeneratePasswordResetTokenAsync(user).ConfigureAwait(false);
            var passwordResetResult = await userManager.ResetPasswordAsync(user, tempResetToken, newPassword).ConfigureAwait(false);
            if (!passwordResetResult.Succeeded)
            {
                using (logger.BeginKeyValueScope("errors", passwordResetResult.Errors.Select(e => e.Description)))
                {
                    logger.LogWarning("Unable to reset password for {email} using token {code}", email, passwordResetCode);
                }
            }

            logger.LogInformation("Successfully reset password for {email} using token {code}", email, passwordResetCode);
            return new ResetPasswordResult
            {
                Success = passwordResetResult.Succeeded,
                ErrorMessage = string.Join(",", passwordResetResult.Errors.Select(e => e.Description))
            };
        }

        /// <summary>
        /// Send direct message to the support.
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<SupportMessage> SendSupportMessage([FromBody]SupportMessage message)
        {
            if (!string.IsNullOrEmpty(User.Identity?.Name))
            {
                message.UserId = $"AppUsers/{User.Identity.Name}";
            }

            using (logger.BeginKeyValueScope("message", message))
            {
                logger.LogInformation("Support message submitted");
            }

            // If we have a userID, see if we can load that user and update his/her name.
            if (!string.IsNullOrEmpty(message.Name) && !string.IsNullOrEmpty(message.UserId))
            {
                var user = await GetUser();
                if (user != null && string.IsNullOrEmpty(user.FirstName) && string.IsNullOrEmpty(user.LastName))
                {
                    // Update their name.
                    var nameParts = message.Name.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    user.FirstName = nameParts.FirstOrDefault() ?? string.Empty;
                    user.LastName = string.Join(' ', nameParts.Skip(1));
                }
            }

            var isMutedUser = await DbSession.Advanced.ExistsAsync("MutedEmails/" + message.Email);
            if (!isMutedUser)
            {
                emailSender.QueueSupportEmail(message, emailOptions.SenderEmail);
            }
            else
            {
                logger.LogInformation("Support email received from muted user {email}. No email will be sent.", message.Email);
            }

            return message;
        }

        [HttpPost]
        public async Task ResendConfirmationEmail([FromBody]AppUser user) // user is just the container for .Email, the rest of the properties aren't filled out
        {
            var userWithEmail = await DbSession.LoadAsync<AppUser>("AppUsers/" + user.Email);
            if (userWithEmail?.EmailConfirmed == false)
            {
                var confirmToken = new AccountToken
                {
                    Id = $"AccountTokens/Confirm/{userWithEmail.Email}",
                    ApplicationUserId = userWithEmail.Id,
                    Token = Guid.NewGuid().ToString()
                };
                await DbSession.StoreAsync(confirmToken);
                DbSession.SetRavenExpiration(confirmToken, DateTime.UtcNow.AddDays(14));

                emailSender.QueueConfirmEmail(userWithEmail.Email, confirmToken.Token, appOptions);
            }
        }

        private SignInStatus SignInStatusFromResult(Microsoft.AspNetCore.Identity.SignInResult result, string email)
        {
            if (result.Succeeded)
            {
                return SignInStatus.Success;
            }

            if (result.IsLockedOut)
            {
                return SignInStatus.LockedOut;
            }

            if (result.IsNotAllowed)
            {
                logger.LogWarning("User {email} couldn't sign in because SignInResult = IsNotAllowed, {result}. Check that the user isn't locked out and has confirmed email.", email, result.ToString());
                return SignInStatus.Failure;
            }
            
            return SignInStatus.Failure;
        }
    }
}
