cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-network-information/www/network.js",
        "id": "cordova-plugin-network-information.network",
        "pluginId": "cordova-plugin-network-information",
        "clobbers": [
            "navigator.connection",
            "navigator.network.connection"
        ]
    },
    {
        "file": "plugins/cordova-plugin-network-information/www/Connection.js",
        "id": "cordova-plugin-network-information.Connection",
        "pluginId": "cordova-plugin-network-information",
        "clobbers": [
            "Connection"
        ]
    },
    {
        "file": "plugins/cordova-plugin-hostedwebapp/www/hostedWebApp.js",
        "id": "cordova-plugin-hostedwebapp.hostedwebapp",
        "pluginId": "cordova-plugin-hostedwebapp",
        "clobbers": [
            "hostedwebapp"
        ]
    },
    {
        "file": "plugins/cordova-plugin-nowplaying/www/NowPlaying.js",
        "id": "cordova-plugin-nowplaying.NowPlaying",
        "pluginId": "cordova-plugin-nowplaying",
        "clobbers": [
            "window.NowPlaying"
        ]
    },
    {
        "file": "plugins/cordova-plugin-remotecommand/www/RemoteCommand.js",
        "id": "cordova-plugin-remotecommand.RemoteCommand",
        "pluginId": "cordova-plugin-remotecommand",
        "clobbers": [
            "window.RemoteCommand"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.3.3",
    "cordova-plugin-network-information": "2.0.1",
    "cordova-plugin-hostedwebapp": "0.3.2",
    "nl.kingsquare.cordova.background-audio": "1.0.1",
    "cordova-plugin-nowplaying": "1.0.0",
    "cordova-plugin-remotecommand": "1.0.0"
}
// BOTTOM OF METADATA
});