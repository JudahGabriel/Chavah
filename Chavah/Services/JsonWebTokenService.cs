using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace BitShuva.Services
{
    public class JsonWebTokenService
    {
        public string WriteToken(string userEmail, bool isUserAdmin, DateTime tokenExpiration)
        {
            var secretKey = ConfigurationManager.AppSettings["JwtSecureKey"];
            var securityKey = new SymmetricSecurityKey(Encoding.Default.GetBytes(secretKey));
            var signInCreds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature);
            var claims = new Claim[]
            {
                new Claim("Email", userEmail),
                new Claim("IsAdmin", isUserAdmin ? bool.TrueString : bool.FalseString)
            };
            var secToken = new JwtSecurityToken("BitShuva.Chavah", "https://messianicradio.com", claims, DateTime.UtcNow, tokenExpiration, signInCreds);
            var handler = new JwtSecurityTokenHandler();
            return handler.WriteToken(secToken);
        }
    }
}