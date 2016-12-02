using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using Raven.Client;
using System.Web.Http;
using System.Net;
using BitShuva.Controllers;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BitShuva.Common
{
    /// <summary>
    /// Action filter that checks for the existence of a JSON web token in request's authorization header.
    /// If found, it will be stored in the controller's SessionToken propery.
    /// Intended to work with RavenApiControllers only.
    /// </summary>
    public class JwtSessionAttribute : Attribute, IActionFilter
    {
        public static readonly string jwtSecureKey = ConfigurationManager.AppSettings["JwtSecureKey"];
        private const string bearerPrefix = "Bearer ";
        private const string authHeaderName = "Authorization";

        public bool AllowMultiple
        {
            get { return false; }
        }

        public async Task<HttpResponseMessage> ExecuteActionFilterAsync(HttpActionContext actionContext, CancellationToken cancellationToken, Func<Task<HttpResponseMessage>> continuation)
        {
            var bearerToken = HttpContext.Current.Request.Headers[authHeaderName];
            var sessionToken = default(SessionToken);
            var controller = actionContext.ControllerContext.Controller as RavenApiController;
            if (!string.IsNullOrEmpty(bearerToken) && bearerToken.StartsWith(bearerPrefix))
            {
                var jwtString = bearerToken.Substring(bearerPrefix.Length);
                var claimsOrNull = TryValidateJwtToken(jwtString);
                if (controller != null && claimsOrNull != null)
                {
                    sessionToken = new SessionToken(claimsOrNull);
                }
            }

            if (sessionToken == null)
            {
                sessionToken = new SessionToken
                {
                    Email = "",
                    IsAdmin = false,
                    IsSignedIn = false
                };
            }

            controller.SessionToken = sessionToken;

            var response = await continuation();
            return response;
        }

        private ClaimsPrincipal TryValidateJwtToken(string jwtString)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.Default.GetBytes(jwtSecureKey));
            var validationParams = new TokenValidationParameters
            {
                IssuerSigningKey = securityKey,
                ValidateAudience = false,
                ValidateActor = false,
                ValidateIssuer = false
            };

            var handler = new JwtSecurityTokenHandler();
            SecurityToken validatedToken;
            try
            {
                return handler.ValidateToken(jwtString, validationParams, out validatedToken);
            }
            catch (SecurityTokenException)
            {
                return null;
            }
        }
    }
}