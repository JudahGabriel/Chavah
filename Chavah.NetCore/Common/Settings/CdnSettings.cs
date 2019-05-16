namespace BitShuva.Chavah.Settings
{
    public class CdnSettings
    {
        /// <summary>
        /// The root host directory for CDNs that use FTP to transfer files.
        /// </summary>
        public string FtpHost { get; set; }

        /// <summary>
        /// The user name for CDNs that use FTP to transfer files.
        /// </summary>
        public string FtpUserName { get; set; }

        /// <summary>
        /// The password for CDNs that use FTP to transfer files.
        /// </summary>
        public string FtpPassword { get; set; }

        /// <summary>
        /// The FTP working directory for CDNs that use FTP to transfer files.
        /// </summary>
        public string FtpWorkingDirectory { get; set; }

        /// <summary>
        /// The name of the directory containing the MP3 audio files.
        /// </summary>
        public string MusicDirectory { get; set; }

        /// <summary>
        /// The name of the directory containing album art.
        /// </summary>
        public string AlbumArtDirectory { get; set; }

        /// <summary>
        /// The name of the directory containing artist images.
        /// </summary>
        public string ArtistImagesDirectory { get; set; }

        /// <summary>
        /// The name of the directory containing user profile pictures.
        /// </summary>
        public string ProfilePicsDirectory { get; set; }

        /// <summary>
        /// The root HTTP path for media stored on the CDN.
        /// </summary>
        public string HttpPath { get; set; }

        /// <summary>
        /// The name of the directory storing sound effects.
        /// </summary>
        public string SoundEffects { get; set; }

        /// <summary>
        /// The API key used for authenticating with the CDN.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// The name of the storage zone into which the CDN stores media.
        /// </summary>
        public string StorageZone { get; set; }
    }
}
