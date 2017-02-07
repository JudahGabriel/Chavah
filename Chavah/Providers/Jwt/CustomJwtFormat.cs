using Microsoft.IdentityModel.Tokens;
using Microsoft.Owin.Security;
using System;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace BitShuva.Providers.Jwt
{
    public class CustomJwtFormat : ISecureDataFormat<AuthenticationTicket>
    {

        private readonly string _issuer = string.Empty;

        public CustomJwtFormat(string issuer)
        {
            _issuer = issuer;
        }

        public string Protect(AuthenticationTicket data)
        {
            if (data == null)
            {
                throw new ArgumentNullException("data");
            }

            string validAudience = ConfigurationManager.AppSettings["Tokens:Audience"];

            var key = Encoding.UTF8.GetBytes(ConfigurationManager.AppSettings["Tokens:Key"]);

            var signingKey = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

            var issued = data.Properties.IssuedUtc;

            var expires = data.Properties.ExpiresUtc;

            var token = new JwtSecurityToken(_issuer,
                                             validAudience,
                                             data.Identity.Claims,
                                             issued.Value.UtcDateTime,
                                             expires.Value.UtcDateTime,
                                             signingKey);

            var handler = new JwtSecurityTokenHandler();

            var jwt = handler.WriteToken(token);

            return jwt;
        }

        public AuthenticationTicket Unprotect(string protectedText)
        {
            throw new NotImplementedException();
        }
    }
}