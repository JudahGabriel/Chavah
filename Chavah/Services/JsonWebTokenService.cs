using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;
//v5
//using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens;
//v5
//using System.IdentityModel.Tokens.Jwt;

namespace BitShuva.Services
{
    public class JsonWebTokenService
    {
        public string WriteToken(string userEmail, bool isUserAdmin, DateTime tokenExpiration)
        {
            var secretKey = ConfigurationManager.AppSettings["JwtSecureKey"];
            //v5
            //var securityKey = new SymmetricSecurityKey(Encoding.Default.GetBytes(secretKey));
            var securityKey = new InMemorySymmetricSecurityKey(Encoding.Default.GetBytes(secretKey));
            //v5
            //var signInCreds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature);
            //v4
            var signInCreds = new SigningCredentials(securityKey,
                                                        "http://www.w3.org/2001/04/xmldsig-more#hmac-sha256",
                                                        "http://www.w3.org/2001/04/xmlenc#sha256");

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