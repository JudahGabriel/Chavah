// Typings for MediaSession APIs, a new set of APIs being adopted on mobile browsers 
// to show media info (art, album, artist, song name, etc.) on the phone's lock screen.

interface IMediaMetadata {
    title: string;
    artist: string;
    album: string;
    artwork: { src: string; sizes: string; type: string; }[];
}