using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// An HTML5 push notification. This is serialized to JSON and sent to the service worker, which unpacks it and shows the notification.
    /// </summary>
    public class PushNotification
    {
        /// <summary>
        /// The title text to show in the notification header.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// The longer text to show in the body of the notification.
        /// </summary>
        public string Body { get; set; }

        /// <summary>
        /// The image of the URL to show in the push notification. This is the predominant, large image shown in the alert. This is optional.
        /// </summary>
        public string ImageUrl { get; set; }

        /// <summary>
        /// The URL of the small image to show on the left side of the alert. If omitted,, the browser will use the 120x120 Chavah logo.
        /// </summary>
        public string IconUrl { get; set; }

        /// <summary>
        /// The URL to open if the user clicks the notification.
        /// </summary>
        public string ClickUrl { get; set; }

        ///// <summary>
        ///// A dictionary of actions. These will appear as buttons in the notification. The key should be a title, the value should be a URL that will launch when the button is clicked.
        ///// </summary>
        //public Dictionary<string, string> Actions { get; set; } = new Dictionary<string, string>();
    }
}
