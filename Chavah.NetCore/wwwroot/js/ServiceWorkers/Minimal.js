self.addEventListener('fetch', function (event) { });

self.addEventListener('push', function (event) {
    var pushNotification = event.data.json(); // this will be a Models.PushNotification

    event.waitUntil(
        self.registration.showNotification(pushNotification.title || 'Chavah Messianic Radio', {
            body: pushNotification.body,
            icon: pushNotification.iconUrl || '/images/chavah120x120.png',
            image: pushNotification.imageUrl, // The big image to show. In Chrome, this shows on the top of hte notification, unscaled and clipped to the window
            data: pushNotification.clickUrl,
            badge: '/images/chavah48x48.png',
            //requireInteraction: true, Stays visible until the user dismisses. I feel this is a bad UX, so I've commented it out.
            actions: [
                {
                    action: 'read',
                    title: 'Read more...'
                }
            ]
        })
    );
});

self.onnotificationclick = function (event) {
    var url = event && event.notification ? event.notification.data : "";
    event.notification.close();

    if (url) {
        event.waitUntil(clients.openWindow(url));
    }
};
