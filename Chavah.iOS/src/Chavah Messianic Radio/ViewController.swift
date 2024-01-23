import UIKit
import WebKit
import AVFoundation

var webView: WKWebView! = nil
var audioPlayer = AudioPlayer() // Chavah uses native iOS audio in the iOS app to get around Apple's continual breaking of HTML5 audio, most recently twitter.com/JudahGabriel/status/1748246465863205110

class ViewController: UIViewController, WKNavigationDelegate, AudioPlayerDelegate {

    @IBOutlet weak var loadingView: UIView!
    @IBOutlet weak var progressView: UIProgressView!
    @IBOutlet weak var connectionProblemView: UIImageView!
    @IBOutlet weak var webviewView: UIView!
    @IBOutlet weak var splashBkgView: UIView!
    var toolbarView: UIToolbar!
    
    var htmlIsLoaded = false
    
    private var themeObservation: NSKeyValueObservation?
    var currentWebViewTheme: UIUserInterfaceStyle = .unspecified
    override var preferredStatusBarStyle : UIStatusBarStyle {
        if #available(iOS 13, *), overrideStatusBar{
            if #available(iOS 15, *) {
                return .default
            } else {
                return statusBarTheme == "dark" ? .lightContent : .darkContent
            }
        }
        return .default
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        initAudioPlayer()
        initWebView()
        initToolbarView()
        loadRootUrl()
        
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: .mixWithOthers)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
             debugPrint(error)
        }
        
        NotificationCenter.default.addObserver(self, selector: #selector(self.keyboardWillHide(_:)), name: UIResponder.keyboardWillHideNotification , object: nil)
    }
    
    @objc func keyboardWillHide(_ notification: NSNotification) {
        ChavahMessianicRadio.webView.setNeedsLayout()
    }
    
    func initWebView() {
        ChavahMessianicRadio.webView = createWebView(container: webviewView, WKSMH: self, WKND: self, NSO: self, VC: self)
        webviewView.addSubview(ChavahMessianicRadio.webView);
        ChavahMessianicRadio.webView.uiDelegate = self;
        ChavahMessianicRadio.webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
        
        if #available(iOS 15.0, *), adaptiveUIStyle {
            themeObservation = ChavahMessianicRadio.webView.observe(\.underPageBackgroundColor) { [unowned self] webView, _ in
                currentWebViewTheme = ChavahMessianicRadio.webView.underPageBackgroundColor.isLight() ?? true ? .light : .dark
                self.overrideUIStyle()
            }
        }
    }
    
    func initAudioPlayer() {
        // will call dispatchEventToWeb func.
        ChavahMessianicRadio.audioPlayer.eventTarget = self
    }
    
    // This is where we talk to the JS.
    // We dispatch events onto the window object indicating things like current track position.
    // To see the inverse, web JS talking to Swift, see WKSwiftMessageHandler in this file.
    func dispatchEventToWeb(eventName: String) {
        let player = ChavahMessianicRadio.audioPlayer
        
        // Change the name of the event from X to iosaudioX. "timeupdate" becomes "iosaudiotimeupdate"
        let webEventName = "iosaudio\(eventName)"
        
        var eventJs = "";
        switch (eventName) {
        case "error":
            eventJs = "new ErrorEvent('\(webEventName)', { message: '\(player.error?.localizedDescription ?? "")' })"
        case "timeupdate":
            eventJs = "new CustomEvent('\(webEventName)', { detail: { currentTime: \(player.currentTime as Double), duration: \(player.duration as Double) } })"
        default:
            eventJs = "new CustomEvent('\(webEventName)', { detail: null })"
        }

        let js = "window.dispatchEvent(\(eventJs))"
        ChavahMessianicRadio.webView.evaluateJavaScript(js)
    }
    
    func createToolbarView() -> UIToolbar{
        let statusBarHeight = getStatusBarHeight()
        let toolbarView = UIToolbar(frame: CGRect(x: 0, y: 0, width: webviewView.frame.width, height: 0))
        toolbarView.sizeToFit()
        toolbarView.frame = CGRect(x: 0, y: 0, width: webviewView.frame.width, height: toolbarView.frame.height + statusBarHeight)
//        toolbarView.autoresizingMask = [.flexibleTopMargin, .flexibleRightMargin, .flexibleWidth]
        
        let flex = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
        let close = UIBarButtonItem(barButtonSystemItem: .done, target: self, action: #selector(loadRootUrl))
        toolbarView.setItems([close,flex], animated: true)
        
        toolbarView.isHidden = true
        
        return toolbarView
    }

    func getStatusBarHeight() -> CGFloat {
        let winScene = UIApplication.shared.connectedScenes.first
        let windowScene = winScene as! UIWindowScene
        var statusBarHeight = windowScene.statusBarManager?.statusBarFrame.height ?? 60
        
        #if targetEnvironment(macCatalyst)
        if (statusBarHeight == 0) {
            statusBarHeight = 30
        }
        #endif
        
        return statusBarHeight;
    }
    
    func initToolbarView() {
        toolbarView =  createToolbarView()        
        webviewView.addSubview(toolbarView)

        // Set the top of the splashBkgView to the bottom of the status bar.
//        let statusBarHeight = getStatusBarHeight()
//        let splashBkgFrame = self.splashBkgView.frame
//        self.splashBkgView.frame = CGRect(x: splashBkgFrame.minX, y: statusBarHeight, width: splashBkgFrame.width, height: splashBkgFrame.height)
    }
    
    func overrideUIStyle(toDefault: Bool = false) {
        if #available(iOS 15.0, *), adaptiveUIStyle {
            if (((htmlIsLoaded && !ChavahMessianicRadio.webView.isHidden) || toDefault) && self.currentWebViewTheme != .unspecified) {
                UIApplication
                    .shared
                    .connectedScenes
                    .flatMap { ($0 as? UIWindowScene)?.windows ?? [] }
                    .first { $0.isKeyWindow }?.overrideUserInterfaceStyle = toDefault ? .unspecified : self.currentWebViewTheme;
            }
        }
    }
    
    @objc func loadRootUrl() {
        // Was the app launched via a universal link? If so, navigate to that.
        // Otherwise, see if we were launched via shortcut and nav to that.
        // If neither, just nav to the main PWA URL.
        let launchUrl = SceneDelegate.universalLinkToLaunch ?? SceneDelegate.shortcutLinkToLaunch ?? rootUrl;
        ChavahMessianicRadio.webView.load(URLRequest(url: launchUrl))
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!){
        htmlIsLoaded = true;
        
        self.setProgress(1.0, true);
        self.animateConnectionProblem(false);
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            ChavahMessianicRadio.webView.isHidden = false;
            self.loadingView.isHidden = true;
           
            self.setProgress(0.0, false);
            
            self.overrideUIStyle()
        }
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        htmlIsLoaded = false;
        
        if (error as NSError)._code != (-999) {
            self.overrideUIStyle(toDefault: true);
            
            webView.isHidden = true;
            loadingView.isHidden = false;
            animateConnectionProblem(true);
            
            setProgress(0.05, true);

            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                self.setProgress(0.1, true);
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                    self.loadRootUrl();
                }
            }
        }
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {

        if (keyPath == #keyPath(WKWebView.estimatedProgress) &&
                ChavahMessianicRadio.webView.isLoading &&
                !self.loadingView.isHidden &&
                !self.htmlIsLoaded) {
                    var progress = Float(ChavahMessianicRadio.webView.estimatedProgress);
                    
                    if (progress >= 0.8) { progress = 1.0; };
                    if (progress >= 0.3) { self.animateConnectionProblem(false); }
                    
                    self.setProgress(progress, true);
            
        }
    }
    
    func setProgress(_ progress: Float, _ animated: Bool) {
        self.progressView.setProgress(progress, animated: animated);
    }
    
    func animateConnectionProblem(_ show: Bool) {
        if (show) {
            self.connectionProblemView.isHidden = false;
            self.connectionProblemView.alpha = 0
            UIView.animate(withDuration: 0.7, delay: 0, options: [.repeat, .autoreverse], animations: {
                self.connectionProblemView.alpha = 1
            })
        }
        else {
            UIView.animate(withDuration: 0.3, delay: 0, options: [], animations: {
                self.connectionProblemView.alpha = 0 // Here you will get the animation you want
            }, completion: { _ in
                self.connectionProblemView.isHidden = true;
                self.connectionProblemView.layer.removeAllAnimations();
            })
        }
    }
        
    deinit {
        ChavahMessianicRadio.webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress))
    }
}

// This is where the web talks to us in Swift land.
// It sends us messages like "pause the song", "set the audio src to https://...", etc.
extension ViewController: WKScriptMessageHandler {
    
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "print" {
            printView(webView: ChavahMessianicRadio.webView)
        }
        if message.name == "push-subscribe" {
            handleSubscribeTouch(message: message)
        }
        if message.name == "push-permission-request" {
            handlePushPermission()
        }
        if message.name == "push-permission-state" {
            handlePushState()
        }
      
      // This is called when the web app calls into Swift.
      if message.name == "audiohandler" {
          let player = ChavahMessianicRadio.audioPlayer
          if let messageBody = message.body as? [String: Any], let action = messageBody["action"] as? String {
              // Supported actions: 
              // - src
              // - currentTime
              // - volume
              // - pause
              // - play
              // - mediasession
              if action == "src", let src = messageBody["details"] as? String {
                  player.src = URL(string: src)
              } else if action == "currentTime", let currentTime = messageBody["details"] as? Double {
                  player.currentTime = currentTime
              } else if action == "volume", let volume = messageBody["details"] as? Float {
                  player.volume = volume
              } else if action == "pause" {
                  player.pause()
              } else if action == "play" {
                  player.play()
              } else if action == "mediasession", let mediaSessionJson = messageBody["details"] as? String {
                  do {
                      let mediaSession = try JSONDecoder().decode(
                        MediaSession.self,
                        from: mediaSessionJson.data(using: .utf8)!)
                      player.setMediaSession(mediaSession: mediaSession);
                  } catch {
                      print("Error decoding and setting media session", error.localizedDescription)
                  }
              }
          }
          
          //ChavahMessianicRadio.webView.evaluateJavaScript("document.querySelector('audio').src = 'https://judahtemp.b-cdn.net/ios-webkit-audio-bug/1.mp3'; document.querySelector('audio').currentTime = 0;  document.querySelector('audio').play();  document.querySelector('.title').innerText = 'foo!';")
      }
  }
}

extension UIColor {
    // Check if the color is light or dark, as defined by the injected lightness threshold.
    // Some people report that 0.7 is best. I suggest to find out for yourself.
    // A nil value is returned if the lightness couldn't be determined.
    func isLight(threshold: Float = 0.5) -> Bool? {
        let originalCGColor = self.cgColor

        // Now we need to convert it to the RGB colorspace. UIColor.white / UIColor.black are greyscale and not RGB.
        // If you don't do this then you will crash when accessing components index 2 below when evaluating greyscale colors.
        let RGBCGColor = originalCGColor.converted(to: CGColorSpaceCreateDeviceRGB(), intent: .defaultIntent, options: nil)
        guard let components = RGBCGColor?.components else {
            return nil
        }
        guard components.count >= 3 else {
            return nil
        }

        let brightness = Float(((components[0] * 299) + (components[1] * 587) + (components[2] * 114)) / 1000)
        return (brightness > threshold)
    }
}
