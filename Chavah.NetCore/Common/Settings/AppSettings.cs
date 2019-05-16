namespace BitShuva.Chavah.Settings
{
    public class AppSettings
    {
        /// <summary>
        /// Name of the application instance.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Title of the application instance
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Description of the application instance.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Version of the application instance.
        /// </summary>
        public string Version { get; set; }

        /// <summary>
        /// Default Url for the application Instance.
        /// </summary>
        public string DefaultUrl { get; set; }

        /// <summary>
        /// Google Analytics ID.
        /// </summary>
        public string GoogleAnalytics { get; set; }

        /// <summary>
        /// The default language is English.
        /// </summary>
        public string Language { get; set; } = "en-US";

        public bool IsDownForMaintenance { get; set; }

        /// <summary>
        /// Specify what service work file to use. The Default is Minimal.js.
        /// </summary>
        public string ServiceWorker { get; set; } = "Minimal.js";

        public string PushNotificationsPublicKey { get; set; }

        public string PushNotificationsPrivateKey { get; set; }

        public string PushNotificationsImageUrl { get; set; }

        /// <summary>
        /// Used for push notifications.
        /// </summary>
        public string AuthorImageUrl { get; set; }

        public string IftttKey { get; set; }

        public string FilePickrKey { get; set; }
    }
}
