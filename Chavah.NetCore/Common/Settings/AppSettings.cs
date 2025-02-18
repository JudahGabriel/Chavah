namespace BitShuva.Chavah.Settings
{
    public class AppSettings
    {
        /// <summary>
        /// Name of the application instance.
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Title of the application instance
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Description of the application instance.
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Version of the application instance.
        /// </summary>
        public string Version { get; set; } = string.Empty;

        /// <summary>
        /// Default Url for the application Instance.
        /// </summary>
        public string DefaultUrl { get; set; } = string.Empty;

        /// <summary>
        /// Google Analytics ID.
        /// </summary>
        public string GoogleAnalytics { get; set; } = string.Empty;

        /// <summary>
        /// The default language is English.
        /// </summary>
        public string Language { get; set; } = "en-US";

        public bool IsDownForMaintenance { get; set; }

        /// <summary>
        /// Specify what service work file to use. The Default is Minimal.js.
        /// </summary>
        public string ServiceWorker { get; set; } = "Minimal.js";

        public string PushNotificationsPublicKey { get; set; } = string.Empty;

        public string PushNotificationsPrivateKey { get; set; } = string.Empty;

        public string PushNotificationsImageUrl { get; set; } = string.Empty;

        /// <summary>
        /// Used for push notifications.
        /// </summary>
        public string AuthorImageUrl { get; set; } = string.Empty;

        public string IftttKey { get; set; } = string.Empty;

        /// <summary>
        /// The PayPal client ID.
        /// </summary>
        public string PayPalClientId { get; set; } = string.Empty;

        /// <summary>
        /// The PayPal client secret.
        /// </summary>
        public string PayPalClientSecret { get; set; } = string.Empty;

        /// <summary>
        /// The PayPal API environement. Should be either "sandbox" or "production".
        /// </summary>
        public string PayPalEnv { get; set; } = "sandbox";
    }
}
