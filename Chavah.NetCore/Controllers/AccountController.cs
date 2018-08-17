using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
        private readonly IAsyncDocumentSession asyncDocumentSession;
        private readonly SignInManager<AppUser> signInManager;
        private readonly IEmailService emailSender;
        private readonly AppSettings options;
        private readonly IMapper mapper;

        public AccountController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            IAsyncDocumentSession asyncDocumentSession,
            ILogger<AccountController> logger,
            IEmailService emailSender,
            IOptions<AppSettings> options,
            IMapper mapper)
            : base(asyncDocumentSession, logger)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
            this.asyncDocumentSession = asyncDocumentSession;
            this.emailSender = emailSender;
            this.options = options?.Value;
            this.mapper = mapper;
        }

        /// <summary>
        /// User SignIn.
        /// </summary>
        /// <param name="email"></param>
        /// <param name="password"></param>
        /// <param name="staySignedIn"></param>
        /// <returns></returns>
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
            var user = await userManager.FindByEmailAsync(email).ConfigureAwait(false);
            var isCorrectPassword = false;
            if (user != null)
            {
                isCorrectPassword = await userManager.CheckPasswordAsync(user, password)
                    .ConfigureAwait(false);
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

            var isEmailConfirmed = await userManager.IsEmailConfirmedAsync(user)
                .ConfigureAwait(false);
            if (!isEmailConfirmed)
            {
                return new Models.SignInResult
                {
                    Status = SignInStatus.RequiresVerification
                };
            }

            var signInResult = await signInManager.PasswordSignInAsync(email, password, staySignedIn, lockoutOnFailure: false)
                .ConfigureAwait(false);
            var result = new Models.SignInResult
            {
                Status = SignInStatusFromResult(signInResult),
                User = mapper.Map<UserViewModel>(user)
            };

            // If we've successfully signed in, store the json web token in the user.
            if (result.Status != SignInStatus.Success)
            {
                logger.LogInformation("Sign in failed with {result}", result);
            }

            return result;
        }

        /// <summary>
        /// SingOut from the app.
        /// </summary>
        /// <returns></returns>
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
            var user = await DbSession.LoadAsync<AppUser>("AppUsers/" + email).ConfigureAwait(false);
            if (user?.RequiresPasswordReset != true || password.Length < 6 || !password.Any(c => char.IsDigit(c)))
            {
                throw new UnauthorizedAccessException();
            }

            var userId = "AppUsers/" + email;
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
        public async Task<UserViewModel> GetUserWithEmail(string email)
        {
            var user = await DbSession.LoadAsync<AppUser>("AppUsers/" + email).ConfigureAwait(false);
            if (user != null)
            {
                // Remove the user from the session, as we're going to clear out the password hash for security reasons before sending it to the user.
                DbSession.Advanced.Evict(user);
            }

            return mapper.Map<UserViewModel>(user);
        }

        /// <summary>
        /// Clear Notifications for the authorized user.
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public async Task<int> ClearNotifications()
        {
            var user = await GetCurrentUserOrThrow().ConfigureAwait(false);
            var count = user.Notifications.Count;
            user.Notifications
                .ForEach(n => n.IsUnread = false);

            return count;
        }

        /// <summary>
        /// Register a new user.
        /// </summary>
        /// <param name="email"></param>
        /// <param name="password"></param>
        /// <returns></returns>
        [HttpPost]
        [AllowAnonymous]
        public async Task<RegisterResults> Register(string email, string password)
        {
            // See if we're already registered.
            var emailLower = email.ToLowerInvariant();
            var existingUser = await userManager.FindByEmailAsync(emailLower).ConfigureAwait(false);
            if (existingUser != null)
            {
                return new RegisterResults
                {
                    ErrorMessage = "You're already registered.",
                    IsAlreadyRegistered = true,
                    NeedsConfirmation = !existingUser.EmailConfirmed
                };
            }

            // The user doesn't exist yet. Try and register him.
            var user = new AppUser
            {
                Id = "AppUsers/" + emailLower,
                UserName = email,
                Email = email,
                LastSeen = DateTime.UtcNow,
                RegistrationDate = DateTime.UtcNow
            };
            var createUserResult = await userManager.CreateAsync(user, password).ConfigureAwait(false);
            if (createUserResult.Succeeded)
            {
                // Send confirmation email.
                var confirmToken = new AccountToken //await UserManager.GenerateEmailConfirmationTokenAsync(user.Id);
                {
                    Id = $"AccountTokens/Confirm/{emailLower}",
                    ApplicationUserId = user.Id,
                    Token = Guid.NewGuid().ToString()
                };
                await DbSession.StoreAsync(confirmToken).ConfigureAwait(false);
                DbSession.SetRavenExpiration(confirmToken, DateTime.UtcNow.AddDays(14));

                emailSender.QueueConfirmEmail(email, confirmToken.Token, options?.Application);

                logger.LogInformation("Sending new user confirmation email to {email} with confirm token {token}", email, confirmToken.Token);
                return new RegisterResults
                {
                    Success = true
                };
            }
            else
            {
                // Registration failed.
                logger.LogWarning("Register new user failed with {result}", createUserResult);
                return new RegisterResults
                {
                    ErrorMessage = string.Join(", ", createUserResult.Errors.Select(s => s.Description))
                };
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
            var emailLower = email.ToLowerInvariant();
            var userId = "AppUsers/" + emailLower;
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

            var regTokenId = $"AccountTokens/Confirm/{emailLower}";
            var regToken = await DbSession.LoadOptionAsync<AccountToken>(regTokenId).ConfigureAwait(false);
            var isSameCode = regToken.Map(t => string.Equals(t.Token, confirmCode, StringComparison.InvariantCultureIgnoreCase)).ValueOr(false);
            var isSameUser = regToken.Map(t => string.Equals(t.ApplicationUserId, userId, StringComparison.InvariantCultureIgnoreCase)).ValueOr(false);
            var isValidToken = isSameCode && isSameUser;
            var errorMessage = default(string);
            if (isValidToken)
            {
                user.EmailConfirmed = true;
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
            var userId = "AppUsers/" + email.ToLower();
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
                Id = "AccountTokens/Reset/" + user.Email,
                Token = Guid.NewGuid().ToString()
            };
            await DbSession.StoreAsync(passwordResetToken).ConfigureAwait(false);
            DbSession.SetRavenExpiration(passwordResetToken, DateTime.UtcNow.AddDays(14));

            emailSender.QueueResetPassword(email, passwordResetToken.Token, options.Application);

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
            var userId = "AppUsers/" + email.ToLower();
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
            if (!string.IsNullOrEmpty(User.Identity.Name))
            {
                message.UserId = "AppUsers/" + User.Identity.Name;
            }

            using (logger.BeginKeyValueScope("message", message))
            {
                logger.LogInformation("Support message submitted");
            }

            // If we have a userID, see if we can load that user and update his/her name.
            if (!string.IsNullOrEmpty(message.Name) && !string.IsNullOrEmpty(message.UserId))
            {
                var user = await this.GetCurrentUser();
                if (string.IsNullOrEmpty(user.FirstName) && string.IsNullOrEmpty(user.LastName))
                {
                    // Update their name.
                    var nameParts = message.Name.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    user.FirstName = nameParts.FirstOrDefault();
                    user.LastName = string.Join(' ', nameParts.Skip(1));
                }
            }

            this.emailSender.QueueSupportEmail(message, options.Email.SenderEmail);
            return message;
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