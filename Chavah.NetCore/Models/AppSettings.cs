namespace BitShuva.Chavah.Models
{

    public class AppSettings
    {
        public static Connectionstrings ConnectionStrings { get; set; }
        public static Logging Logging { get; set; }
        public static Email Email { get; set; }
        public static Cdn Cdn { get; set; }
        public static Filepickr FilePickr { get; set; }
        public static Ifttt Ifttt { get; set; }
        public static Jwt Jwt { get; set; }
    }

    public class Connectionstrings
    {
        public string RavenConnection { get; set; }
    }

    public class Logging
    {
        public bool IncludeScopes { get; set; }
        public Loglevel LogLevel { get; set; }
    }

    public class Loglevel
    {
        public string Default { get; set; }
        public string System { get; set; }
        public string Microsoft { get; set; }
    }

    public class Email
    {
        public string SendGridApiKey { get; set; }
    }

    public class Cdn
    {
        public string FtpHost { get; set; }
        public string FtpUserName { get; set; }
        public string FtpPassword { get; set; }
        public string FtpWorkingDirectory { get; set; }
        public string MusicDirectory { get; set; }
        public string AlbumArtDirectory { get; set; }
        public string ArtistImagesDirectory { get; set; }
        public string HttpPath { get; set; }
    }

    public class Filepickr
    {
        public string Key { get; set; }
    }

    public class Ifttt
    {
        public string Key { get; set; }
    }

    public class Jwt
    {
        public string audience { get; set; }
        public string issuer { get; set; }
        public string key { get; set; }
    }

}
