//
//  AudioPlayer.swift
//  Chavah Messianic Radio
//
//  Created by Judah Himango on 1/18/24.
//

import Foundation
import AVFoundation
import MediaPlayer

// Wraps AVAudioPlayer to provide a simple way to play audio files in succession.
class AudioPlayer {
    private let player: AVPlayer
    private var hasPeriodicTimeObserver = false
    private var lastPlaybackTime: TimeInterval?
    private var _url: URL?
    private var mediaSessionInfo = [String : Any]() // dictionary we send to iOS media session APIs
    private var lastMediaArtwork: String?
    var error: Error?
    weak var eventTarget: AudioPlayerDelegate?
    var src: URL? {
        get { return _url }
        set {
            // Remove any listener for end event
            if let currentItem = player.currentItem {
                unobserveAudioEvents(item: currentItem)
            }
            
            // Set the player's URL to this new src
            _url = newValue
            if let url = newValue {
                let urlItem = AVPlayerItem(url: url)
                player.replaceCurrentItem(with: urlItem)
                observeAudioEvents(item: urlItem)
            }
        }
    }
    var currentTime: TimeInterval {
        get {
            return player.currentItem?.currentTime().seconds ?? TimeInterval(0)
        }
        set {
            player.seek(to: CMTime(seconds: newValue, preferredTimescale: 1))
        }
    }
    var volume: Float {
        get { player.volume }
        set { player.volume = newValue }
    }
    var duration: TimeInterval {
        get { player.currentItem?.duration.seconds ?? 0 }
    }
    
    init() {
        player = AVPlayer()
    }
    
    func pause() {
        player.pause();
        eventTarget?.dispatchEventToWeb(eventName: "pause")
    }
    
    func play() {
        player.play()
        eventTarget?.dispatchEventToWeb(eventName: "play")
    }
    
    func nextSong() {
        if let currentSong = player.currentItem {
            self.currentTime = currentSong.duration.seconds
            self.play()
        }
    }
    
    func setMediaSession(mediaSession: MediaSession) {
        // No artwork? Skip this.
        if (mediaSession.artwork == nil || mediaSession.artwork == "" || mediaSession.artwork == self.lastMediaArtwork) {
            return;
        }
        
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
            
            // Grab the artwork from the web.
            self.lastMediaArtwork = mediaSession.artwork
            let artworkUrl = URL(string: mediaSession.artwork!)
            let artworkData = try Data (contentsOf: artworkUrl!)
            let artwork = MPMediaItemArtwork (boundsSize: CGSize (width: 100, height: 100)) { size in return UIImage (data: artworkData)! }

            // Setup the media session info so that lock screen shows album art, song name, artist, album.
            self.mediaSessionInfo[MPMediaItemPropertyTitle] = mediaSession.songTitle ?? ""
            self.mediaSessionInfo[MPMediaItemPropertyArtist] = mediaSession.artist ?? ""
            self.mediaSessionInfo[MPMediaItemPropertyAlbumTitle] = mediaSession.album ?? ""
            self.mediaSessionInfo[MPMediaItemPropertyArtwork] = artwork
            let nowPlayingCenter = MPNowPlayingInfoCenter.default()
            nowPlayingCenter.nowPlayingInfo = self.mediaSessionInfo
            nowPlayingCenter.playbackState = .playing
            
            // Setup command center so that play/pause buttons are shown.
            let commandCenter = MPRemoteCommandCenter.shared()
            commandCenter.playCommand.isEnabled = true
            commandCenter.pauseCommand.isEnabled = true
            commandCenter.nextTrackCommand.isEnabled = true
            commandCenter.playCommand.addTarget { event in
                self.play()
                return .success
            }
            commandCenter.pauseCommand.addTarget { event in
                self.pause()
                return .success
            }
            commandCenter.nextTrackCommand.addTarget { event in
                self.nextSong()
                return .success
            }
        } catch {
            print("Error setting media session", error.localizedDescription)
        }
    }
    
    private func durationTimerTick(time: CMTime) {
        if (time.seconds != lastPlaybackTime) {
            lastPlaybackTime = time.seconds
            eventTarget?.dispatchEventToWeb(eventName: "timeupdate")
            
            self.mediaSessionInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = time.seconds
            self.mediaSessionInfo[MPMediaItemPropertyPlaybackDuration] = self.duration
            MPNowPlayingInfoCenter.default().nowPlayingInfo = self.mediaSessionInfo
        }
    }
    
    private func observeAudioEvents(item: AVPlayerItem) {
        // Listen for currentTime changed if need be.
        if hasPeriodicTimeObserver == false {
            hasPeriodicTimeObserver = true
            player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 1, preferredTimescale: 600), queue: .main) { time in
                self.durationTimerTick(time: time)
            }
        }
        
        // Listen for audio ended.
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(audioDidEnd),
            name: AVPlayerItem.didPlayToEndTimeNotification,
            object: item)
        
        // Listen for stalled
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(audioDidStall),
            name: AVPlayerItem.playbackStalledNotification,
            object: item)
    }
    
    private func unobserveAudioEvents(item: AVPlayerItem) {
        // Unobserve ended
        NotificationCenter.default.removeObserver(
            self,
            name: AVPlayerItem.didPlayToEndTimeNotification,
            object: item)
        
        // Unobserve stalled
        NotificationCenter.default.removeObserver(
            self,
            name: AVPlayerItem.playbackStalledNotification,
            object: item)
    }

    // protocol implementation for AVAudioPlayerDelegate
    @objc func audioDidEnd() {
        eventTarget?.dispatchEventToWeb(eventName: "ended")
    }
    
    @objc func audioDidStall() {
        eventTarget?.dispatchEventToWeb(eventName: "stalled")
    }
    
    // protocol implementation for AVAudioPlayerDelegate
    func audioPlayerBeginInterruption(_ player: AVAudioPlayer) {
        eventTarget?.dispatchEventToWeb(eventName: "stalled")
    }
    
    // protocol implementation for AVAudioPlayerDelegate
    func audioPlayerEndInterruption(_ player: AVAudioPlayer, withOptions: Int) {
        eventTarget?.dispatchEventToWeb(eventName: "playing")
    }
}
