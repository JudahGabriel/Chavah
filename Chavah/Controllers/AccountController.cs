using BitShuva.Models;
using BitShuva.Models.Indexes;
using Chavah.Common;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Owin.Security;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.ServiceModel.Syndication;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace BitShuva.Controllers
{
    [RequireHttps]
    public class AccountController : RavenController
    {
        private ApplicationSignInManager signInManager;
        private ApplicationUserManager userManager;

        public AccountController()
        {
        }

        public AccountController(ApplicationUserManager userManager, ApplicationSignInManager signInManager)
        {
            UserManager = userManager;
            SignInManager = signInManager;
        }

        public ApplicationSignInManager SignInManager
        {
            get
            {
                return signInManager ?? HttpContext.GetOwinContext().Get<ApplicationSignInManager>();
            }
            private set { signInManager = value; }
        }

        public ApplicationUserManager UserManager
        {
            get
            {
                return userManager ?? HttpContext.GetOwinContext().GetUserManager<ApplicationUserManager>();
            }
            private set
            {
                userManager = value;
            }
        }

        [HttpGet]
        public async Task<ActionResult> RegisteredUsers()
        {
            var lastRegisteredUsers = await this.DbSession
                .Query<User>()
                .Where(u => u.EmailAddress != null)
                .OrderByDescending(a => a.RegistrationDate)
                .Take(100)
                .ToListAsync();
            var feedItems = from user in lastRegisteredUsers
                            select new SyndicationItem(
                                id: user.Id,
                                lastUpdatedTime: user.RegistrationDate,
                                title: user.EmailAddress,
                                content: "A new user registered on Chavah on " + user.RegistrationDate.ToString() + " with email address " + user.EmailAddress,
                                itemAlternateLink: new Uri("http://messianicradio.com/?user=" + Uri.EscapeUriString(user.Id))
                            );

            var feed = new SyndicationFeed("Chavah Messianic Radio", "The most recent registered users at Chavah Messianic Radio", new Uri("http://messianicradio.com"), feedItems) { Language = "en-US" };
            return new RssActionResult { Feed = feed };
        }

        //
        // POST: /Account/Login
        //[HttpPost]
        //[AllowAnonymous]
        //[ValidateAntiForgeryToken]
        //public async Task<ActionResult> Login(LoginViewModel model, string returnUrl)
        //{
        //    if (!ModelState.IsValid)
        //    {
        //        return View(model);
        //    }

        //    // Require the user to have a confirmed email before they can log on.
        //    // var user = await UserManager.FindByNameAsync(model.Email);
        //    var user = UserManager.Find(model.Email, model.Password);
        //    if (user != null)
        //    {
        //        if (!await UserManager.IsEmailConfirmedAsync(user.Id))
        //        {
        //            string callbackUrl = await SendEmailConfirmationTokenAsync(user.Id, "Confirm your account-Resend");

        //            // Uncomment to debug locally  
        //            ViewBag.Link = callbackUrl;
        //            ViewBag.errorMessage = "You must have a confirmed email to log on. "
        //                                 + "The confirmation token has been resent to your email account.";
        //            return View("Error");
        //        }
        //    }

        //    // This doesn't count login failures towards account lockout
        //    // To enable password failures to trigger account lockout, change to shouldLockout: true
        //    var result = await SignInManager.PasswordSignInAsync(model.Email, model.Password, model.RememberMe, shouldLockout: false);
        //    switch (result)
        //    {
        //        case SignInStatus.Success:
        //            return RedirectToLocal(returnUrl);
        //        case SignInStatus.LockedOut:
        //            return View("Lockout");
        //        case SignInStatus.RequiresVerification:
        //            return RedirectToAction("SendCode", new { ReturnUrl = returnUrl, RememberMe = model.RememberMe });
        //        case SignInStatus.Failure:
        //        default:
        //            ModelState.AddModelError("", "Invalid login attempt.");
        //            return View(model);
        //    }
        //}

        // TODO: move this to a WebApi controller so that SignInResult can be normal cased properties. Then delete AccountController.
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult> SignIn(string email, string password, bool staySignedIn)
        {
            // Require the user to have a confirmed email before they can log on.
            var user = await UserManager.FindAsync(email, password);
            if (user == null)
            {
                return Json(new SignInResult
                {
                    errorMessage = "Bad user name or password",
                    status = SignInStatus.Failure
                });
            }

            var isEmailConfirmed = await UserManager.IsEmailConfirmedAsync(user.Id);
            if (!isEmailConfirmed)
            {
                string callbackUrl = await SendEmailConfirmationTokenAsync(user.Id, "Confirm your account-Resend");
                return Json(new SignInResult
                {
                    status = SignInStatus.RequiresVerification
                });
            }

            var now = DateTime.UtcNow;
            var secretKey = ConfigurationManager.AppSettings["jwtSecureKey"];
            var securityKey = new SymmetricSecurityKey(Encoding.Default.GetBytes(secretKey));
            var signInCreds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature);
            var claims = new Claim[]
            {
                new Claim("Email", user.Email),
                new Claim("IsAdmin", user.Roles.Contains("Admin") ? bool.TrueString : bool.FalseString)
            };
            var expirationTime = staySignedIn ? DateTime.UtcNow.AddDays(365) : DateTime.UtcNow.AddDays(1);
            var secToken = new JwtSecurityToken("BitShuva.Chavah", "https://messianicradio.com", claims, DateTime.UtcNow, expirationTime, signInCreds);
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.WriteToken(secToken);
            
            var signInStatus = await SignInManager.PasswordSignInAsync(email, password, staySignedIn, shouldLockout: false);
            var result = new SignInResult
            {
                status = signInStatus,
                jsonWebToken = signInStatus == SignInStatus.Success ? jwt : null,
                email = user.Email,
                roles = user.Roles
            };
            return Json(result);
        }

        // TODO: move this into a WebAPI controller.
        [HttpPost]
        public ActionResult SignOut()
        {
            AuthenticationManager.SignOut();
            return RedirectToAction("Index", "Home");
        }

        //
        // GET: /Account/VerifyCode
        [AllowAnonymous]
        public async Task<ActionResult> VerifyCode(string provider, string returnUrl, bool rememberMe)
        {
            // Require that the user has already logged in via username/password or external login
            if (!await SignInManager.HasBeenVerifiedAsync())
            {
                return View("Error");
            }
            var user = await UserManager.FindByIdAsync(await SignInManager.GetVerifiedUserIdAsync());
            if (user != null)
            {
                var code = await UserManager.GenerateTwoFactorTokenAsync(user.Id, provider);
                // Remove for Debug
                ViewBag.Code = code;
            }
            return View(new VerifyCodeViewModel { Provider = provider, ReturnUrl = returnUrl, RememberMe = rememberMe });
        }

        //
        // POST: /Account/VerifyCode
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> VerifyCode(VerifyCodeViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            // The following code protects for brute force attacks against the two factor codes. 
            // If a user enters incorrect codes for a specified amount of time then the user account 
            // will be locked out for a specified amount of time. 
            // You can configure the account lockout settings in IdentityConfig
            var result = await SignInManager.TwoFactorSignInAsync(model.Provider, model.Code, isPersistent: model.RememberMe, rememberBrowser: model.RememberBrowser);
            switch (result)
            {
                case SignInStatus.Success:
                    return RedirectToLocal(model.ReturnUrl);
                case SignInStatus.LockedOut:
                    return View("Lockout");
                case SignInStatus.Failure:
                default:
                    ModelState.AddModelError("", "Invalid code.");
                    return View(model);
            }
        }

        //
        // GET: /Account/Register
        [AllowAnonymous]
        public ActionResult Register()
        {
            return View();
        }

        //
        // POST: /Account/Register
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Register(RegisterViewModel model)
        {
            if (ModelState.IsValid)
            {
                var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
                var ravenSession = HttpContext.GetOwinContext().Get<IDocumentSession>();
                ravenSession.Store(user);
                var result = await UserManager.CreateAsync(user, model.Password);
                if (result.Succeeded)
                {
                    //  Comment the following line to prevent log in until the user is confirmed.
                    //  await SignInManager.SignInAsync(user, isPersistent:false, rememberBrowser:false);

                    string callbackUrl = await SendEmailConfirmationTokenAsync(user.Id, "Confirm your account");


                    ViewBag.Message = "Check your email and confirm your account, you must be confirmed "
                                    + "before you can log in.";

                    // For local debug only
                    ViewBag.Link = callbackUrl;

                    // Save the user we put in RavenDB.
                    ravenSession.SaveChanges();

                    return View("Info");
                    //return RedirectToAction("Index", "Home");
                }
                AddErrors(result);
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        //
        // GET: /Account/ConfirmEmail
        [AllowAnonymous]
        public async Task<ActionResult> ConfirmEmail(string userId, string code)
        {
            if (userId == null || code == null)
            {
                return View("Error");
            }

            var ravenSession = HttpContext.GetOwinContext().Get<IDocumentSession>();
            var result = await UserManager.ConfirmEmailAsync(userId, code);
            ravenSession.SaveChanges();
            return View(result.Succeeded ? "ConfirmEmail" : "Error");
        }

        /// <summary>
        /// This is used for migrating old users into the new system. The old users were imported without passwords.
        /// When such a user signs in, we prompt them to create a password.
        /// </summary>
        /// <param name="email"></param>
        /// <param name="password"></param>
        /// <returns></returns>
        public async Task<ActionResult> CreatePassword(string email, string password)
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

            return Json("OK", JsonRequestBehavior.AllowGet);
        }

        //
        // GET: /Account/ForgotPassword
        [AllowAnonymous]
        public ActionResult ForgotPassword()
        {
            return View();
        }

        //
        // POST: /Account/ForgotPassword
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> ForgotPassword(ForgotPasswordViewModel model)
        {
            if (ModelState.IsValid)
            {
                var user = await UserManager.FindByNameAsync(model.Email);
                if (user == null || !(await UserManager.IsEmailConfirmedAsync(user.Id)))
                {
                    // Don't reveal that the user does not exist or is not confirmed
                    return View("ForgotPasswordConfirmation");
                }

                string code = await UserManager.GeneratePasswordResetTokenAsync(user.Id);
                var callbackUrl = Url.Action("ResetPassword", "Account", new { userId = user.Id, code = code }, protocol: Request.Url.Scheme);
                await UserManager.SendEmailAsync(user.Id, "Reset Password",
                   "Please reset your password by clicking <a href=\"" + callbackUrl + "\">here</a>");
                TempData["ViewBagLink"] = callbackUrl;
                return RedirectToAction("ForgotPasswordConfirmation", "Account");
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        //
        // GET: /Account/ForgotPasswordConfirmation
        [AllowAnonymous]
        public ActionResult ForgotPasswordConfirmation()
        {
            ViewBag.Link = TempData["ViewBagLink"];
            return View();
        }

        //
        // GET: /Account/ResetPassword
        [AllowAnonymous]
        public ActionResult ResetPassword(string code)
        {
            return code == null ? View("Error") : View();
        }

        //
        // POST: /Account/ResetPassword
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var user = await UserManager.FindByNameAsync(model.Email);
            if (user == null)
            {
                // Don't reveal that the user does not exist
                return RedirectToAction("ResetPasswordConfirmation", "Account");
            }
            var result = await UserManager.ResetPasswordAsync(user.Id, model.Code, model.Password);
            if (result.Succeeded)
            {
                var ravenSession = HttpContext.GetOwinContext().Get<IDocumentSession>();
                ravenSession.SaveChanges(); // Save the password reset done above.
                return RedirectToAction("ResetPasswordConfirmation", "Account");
            }
            AddErrors(result);
            return View();
        }

        //
        // GET: /Account/ResetPasswordConfirmation
        [AllowAnonymous]
        public ActionResult ResetPasswordConfirmation()
        {
            return View();
        }

        //
        // POST: /Account/ExternalLogin
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult ExternalLogin(string provider, string returnUrl)
        {
            // Request a redirect to the external login provider
            return new ChallengeResult(provider, Url.Action("ExternalLoginCallback", "Account", new { ReturnUrl = returnUrl }));
        }

        //
        // GET: /Account/SendCode
        [AllowAnonymous]
        public async Task<ActionResult> SendCode(string returnUrl, bool rememberMe)
        {
            var userId = await SignInManager.GetVerifiedUserIdAsync();
            if (userId == null)
            {
                return View("Error");
            }
            var userFactors = await UserManager.GetValidTwoFactorProvidersAsync(userId);
            var factorOptions = userFactors.Select(purpose => new SelectListItem { Text = purpose, Value = purpose }).ToList();
            return View(new SendCodeViewModel { Providers = factorOptions, ReturnUrl = returnUrl, RememberMe = rememberMe });
        }

        //
        // POST: /Account/SendCode
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> SendCode(SendCodeViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View();
            }

            // Generate the token and send it
            if (!await SignInManager.SendTwoFactorCodeAsync(model.SelectedProvider))
            {
                return View("Error");
            }
            return RedirectToAction("VerifyCode", new
            {
                Provider = model.SelectedProvider,
                ReturnUrl = model.ReturnUrl,
                RememberMe = model.RememberMe
            });
        }

        //
        // GET: /Account/ExternalLoginCallback
        [AllowAnonymous]
        public async Task<ActionResult> ExternalLoginCallback(string returnUrl)
        {
            var loginInfo = await AuthenticationManager.GetExternalLoginInfoAsync();
            if (loginInfo == null)
            {
                return RedirectToAction("Login");
            }

            // Sign in the user with this external login provider if the user already has a login
            var result = await SignInManager.ExternalSignInAsync(loginInfo, isPersistent: false);
            switch (result)
            {
                case SignInStatus.Success:
                    return RedirectToLocal(returnUrl);
                case SignInStatus.LockedOut:
                    return View("Lockout");
                case SignInStatus.RequiresVerification:
                    return RedirectToAction("SendCode", new { ReturnUrl = returnUrl, RememberMe = false });
                case SignInStatus.Failure:
                default:
                    // If the user does not have an account, then prompt the user to create an account
                    ViewBag.ReturnUrl = returnUrl;
                    ViewBag.LoginProvider = loginInfo.Login.LoginProvider;
                    return View("ExternalLoginConfirmation", new ExternalLoginConfirmationViewModel { Email = loginInfo.Email });
            }
        }

        //
        // POST: /Account/ExternalLoginConfirmation
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> ExternalLoginConfirmation(ExternalLoginConfirmationViewModel model, string returnUrl)
        {
            if (User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Manage");
            }

            if (ModelState.IsValid)
            {
                // Get the information about the user from the external login provider
                var info = await AuthenticationManager.GetExternalLoginInfoAsync();
                if (info == null)
                {
                    return View("ExternalLoginFailure");
                }
                var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
                var ravenSession = HttpContext.GetOwinContext().Get<IDocumentSession>();
                ravenSession.Store(user);
                var result = await UserManager.CreateAsync(user);
                if (result.Succeeded)
                {
                    result = await UserManager.AddLoginAsync(user.Id, info.Login);
                    if (result.Succeeded)
                    {
                        await SignInManager.SignInAsync(user, isPersistent: false, rememberBrowser: false);
                        ravenSession.SaveChanges();
                        return RedirectToLocal(returnUrl);
                    }
                }
                AddErrors(result);
            }

            ViewBag.ReturnUrl = returnUrl;
            return View(model);
        }

        //
        // GET: /Account/ExternalLoginFailure
        [AllowAnonymous]
        public ActionResult ExternalLoginFailure()
        {
            return View();
        }

        static List<User> oldUsers = null;
        static List<string> failedEmailAddresses = new List<string>(100);

        [AllowAnonymous]
        public async Task<ActionResult> UpdateOldDupes(int skip = 0)
        {
            var results = await DbSession.Query<UserDupe, Users_Dupes>()
                .Include(u => u.UserIds)
                .OrderByDescending(u => u.LastSeen)
                .Where(u => u.Count > 1)
                .Skip(skip)
                .Take(10)
                .ToListAsync();
            foreach (var result in results)
            {
                var newUser = await DbSession.LoadAsync<ApplicationUser>("ApplicationUsers/" + result.EmailAddress.ToLower());
                if (newUser == null)
                {
                    throw new Exception("Couldn't find user ApplicationUsers/" + result.EmailAddress.ToLower());
                }

                var oldUsers = await DbSession.LoadAsync<User>(result.UserIds);
                var obsoleteOldUser = oldUsers.OrderByDescending(o => o.LastSeen).Last();
                var mostRecentOldUser = oldUsers.OrderByDescending(o => o.LastSeen).First();
                if (newUser.LastSeen != mostRecentOldUser.LastSeen)
                {
                    newUser.LastSeen = mostRecentOldUser.LastSeen;
                    newUser.Preferences = mostRecentOldUser.Preferences;
                    newUser.RegistrationDate = mostRecentOldUser.RegistrationDate;
                    newUser.TotalPlays = obsoleteOldUser.TotalPlays + mostRecentOldUser.TotalPlays;
                    newUser.TotalSongRequests = obsoleteOldUser.TotalSongRequests + mostRecentOldUser.TotalSongRequests;
                }

            }

            return Json("Updated from dupes " + results.Count.ToString(), JsonRequestBehavior.AllowGet);
        }

        [AllowAnonymous]
        public async Task<ActionResult> Migrate()
        {
            var oldUsers = AccountController.oldUsers;
            var existingUsers = new List<ApplicationUser>(4000);
            using (var ravenSession = RavenContext.Db.OpenSession())
            {
                if (oldUsers == null)
                {
                    oldUsers = new List<Models.User>(4000);
                    using (var stream = ravenSession.Advanced.Stream<User>("Users/"))
                    {
                        while (stream.MoveNext())
                        {
                            oldUsers.Add(stream.Current.Document);
                        }
                    }
                    AccountController.oldUsers = oldUsers;
                }
                
                using (var stream = ravenSession.Advanced.Stream<ApplicationUser>("ApplicationUsers/"))
                {
                    while (stream.MoveNext())
                    {
                        existingUsers.Add(stream.Current.Document);
                    }
                }
            }

            var usersNeedingMigration = oldUsers
                .Where(u => !existingUsers.Any(n => n.Email.ToLower() == u.EmailAddress.ToLower()))
                .Where(u => !failedEmailAddresses.Any(n => n.ToLower() == u.EmailAddress.ToLower()))
                .Distinct(u => u.EmailAddress)
                .Take(10)
                .ToList();
            var errors = new List<string>(20);
            var newUsers = usersNeedingMigration.Select(user => new ApplicationUser
            {
                Email = user.EmailAddress.ToLower(),
                Id = "ApplicationUsers/" + user.EmailAddress.ToLower(),
                LastSeen = user.LastSeen,
                RegistrationDate = user.RegistrationDate,
                Preferences = user.Preferences,
                RequiresPasswordReset = true,
                TotalPlays = user.TotalPlays,
                TotalSongRequests = user.TotalSongRequests,
                UserName = user.EmailAddress
            }).ToList();
            
            foreach (var user in newUsers)
            {
                var createUserResult = await UserManager.CreateAsync(user, "IWillGlorifyTheLord613!" + Guid.NewGuid().ToString());
                if (!createUserResult.Succeeded)
                {
                    errors.AddRange(createUserResult.Errors);
                    failedEmailAddresses.Add(user.Email.ToLower());
                    await DbSession.StoreAsync(new ChavahLog
                    {
                        DateTime = DateTime.UtcNow,
                        Exception = string.Join(Environment.NewLine, createUserResult.Errors),
                        Level = "Error",
                        Message = $"Unable to migrate user {user.Email.ToLower()}"
                    });
                }
            }
            await DbSession.SaveChangesAsync();
            return Json(usersNeedingMigration.Count, JsonRequestBehavior.AllowGet);
        }
        
        // Used for XSRF protection when adding external logins
        private const string XsrfKey = "XsrfId";

        private IAuthenticationManager AuthenticationManager
        {
            get
            {
                return HttpContext.GetOwinContext().Authentication;
            }
        }

        private void AddErrors(IdentityResult result)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError("", error);
            }
        }

        private ActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            return RedirectToAction("Index", "Home");
        }

        internal class ChallengeResult : HttpUnauthorizedResult
        {
            public ChallengeResult(string provider, string redirectUri)
                : this(provider, redirectUri, null)
            {
            }

            public ChallengeResult(string provider, string redirectUri, string userId)
            {
                LoginProvider = provider;
                RedirectUri = redirectUri;
                UserId = userId;
            }

            public string LoginProvider { get; set; }
            public string RedirectUri { get; set; }
            public string UserId { get; set; }

            public override void ExecuteResult(ControllerContext context)
            {
                var properties = new AuthenticationProperties { RedirectUri = RedirectUri };
                if (UserId != null)
                {
                    properties.Dictionary[XsrfKey] = UserId;
                }
                context.HttpContext.GetOwinContext().Authentication.Challenge(properties, LoginProvider);
            }
        }

        private async Task<string> SendEmailConfirmationTokenAsync(string userID, string subject)
        {
            string code = await UserManager.GenerateEmailConfirmationTokenAsync(userID);
            var callbackUrl = Url.Action("ConfirmEmail", "Account",
               new { userId = userID, code = code }, protocol: Request.Url.Scheme);
            await UserManager.SendEmailAsync(userID, subject,
               "Please confirm your account by clicking <a href=\"" + callbackUrl + "\">here</a>");

            return callbackUrl;
        }
    }
}