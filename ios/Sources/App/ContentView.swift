import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        WebContainer()
            .ignoresSafeArea()
    }
}

struct WebContainer: UIViewRepresentable {
    private let webView: WKWebView = {
        let config = WKWebViewConfiguration()
        let controller = WKUserContentController()
        config.userContentController = controller
        config.preferences.javaScriptEnabled = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        let wv = WKWebView(frame: .zero, configuration: config)
        wv.scrollView.bounces = false
        wv.backgroundColor = .black
        wv.isOpaque = false
        return wv
    }()

    func makeUIView(context: Context) -> WKWebView {
        context.coordinator.installBridges()
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator

        let search = locateDashboardHTML()

        if let url = search.url, let root = search.root {
            webView.loadFileURL(url, allowingReadAccessTo: root)
        } else {
            let attemptsHtml = search.attempts.joined(separator: "<br>")
            let htmls = search.htmls.joined(separator: "<br>")
            let dirs = search.dirs.joined(separator: "<br>")
            let message = """
            <div style='font-family:Helvetica;padding:16px;color:#c00'>
            <h2>No se encontró J3DDashBoard.html en el bundle</h2>
            <div style='color:#000;font-size:13px'>Bundle: \(search.bundlePath)<br>Resources: \(search.resourcePath)</div>
            <div style='color:#000;font-size:13px'>Intentos:<br><pre style='white-space:pre-wrap'>\(attemptsHtml)</pre></div>
            <div style='color:#000;font-size:13px'>Dirs en resource root:<br><pre style='white-space:pre-wrap'>\(dirs)</pre></div>
            <div style='color:#000;font-size:13px'>HTMLs detectados (top \(search.htmls.count)):<br><pre style='white-space:pre-wrap'>\(htmls)</pre></div>
            </div>
            """
            webView.loadHTMLString(message, baseURL: nil)
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(webView: webView)
    }

    private func locateDashboardHTML() -> (url: URL?, root: URL?, attempts: [String], htmls: [String], dirs: [String], bundlePath: String, resourcePath: String) {
        let bundlePath = Bundle.main.bundlePath
        let resourcePath = Bundle.main.resourcePath ?? "<nil>"
        var attempts: [String] = []
        let candidates: [(name: String?, ext: String?, sub: String?)] = [
            ("J3DDashBoard", "html", nil),
            ("J3DDashBoard", "html", "assets"),
            ("J3DDashBoard", "html", "app/src/main/assets"),
            ("J3DDashBoard", "html", "main/assets"),
            ("J3DDashBoard", "html", "app"),
            ("J3DDashBoard", "html", "Dashboard"),
            ("J3DDashBoard", "html", "das/Dashboard"),
            ("J3DDashBoard", "HTML", nil),
            ("j3ddashboard", "html", nil),
            ("J3DDashboard", "html", nil),
        ]

        let fm = FileManager.default
        if let resourceURL = Bundle.main.resourceURL {
            for c in candidates {
                let subdir = c.sub ?? "<root>"
                let base = c.sub.map { resourceURL.appendingPathComponent($0) } ?? resourceURL
                let exists = fm.fileExists(atPath: base.path)
                attempts.append("subdir=" + subdir + " exists=" + (exists ? "yes" : "no"))
                if let url = Bundle.main.url(forResource: c.name, withExtension: c.ext, subdirectory: c.sub) {
                    let root = url.deletingLastPathComponent()
                    NSLog("[Bundle] J3DDashBoard.html found at %@ (root=%@)", url.path, root.path)
                    return (url, root, attempts, [], listDirs(resourceURL: resourceURL), bundlePath, resourcePath)
                }
            }
        }

        var foundHtmls: [String] = []
        if let resourceURL = Bundle.main.resourceURL {
            if let enumerator = fm.enumerator(at: resourceURL, includingPropertiesForKeys: nil) {
                for case let url as URL in enumerator where url.pathExtension.lowercased() == "html" {
                    foundHtmls.append(url.path.replacingOccurrences(of: resourcePath + "/", with: ""))
                    if foundHtmls.count >= 200 { break } // limit noise
                }
            }
        }
        NSLog("[Bundle] J3DDashBoard.html NOT found. Bundle=%@ resource=%@ attempts=%@ htmlCount=%d dirs=%@",
              bundlePath,
              resourcePath,
              attempts.joined(separator: " | "),
              foundHtmls.count,
              listDirs(resourceURL: Bundle.main.resourceURL).joined(separator: ","))
        if !foundHtmls.isEmpty {
            NSLog("[Bundle] HTML sample: %@", foundHtmls.prefix(10).joined(separator: " | "))
        }
        return (nil, nil, attempts, foundHtmls, listDirs(resourceURL: Bundle.main.resourceURL), bundlePath, resourcePath)
    }

    private func listDirs(resourceURL: URL?) -> [String] {
        guard let resourceURL else { return [] }
        let fm = FileManager.default
        guard let items = try? fm.contentsOfDirectory(at: resourceURL, includingPropertiesForKeys: nil) else { return [] }
        return items.prefix(50).map { $0.lastPathComponent }
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        private weak var webView: WKWebView?
        private var socket: URLSessionWebSocketTask?
        private var username: String = ""
        private let session = URLSession(configuration: .default)

        init(webView: WKWebView) {
            self.webView = webView
        }

        // MARK: - Bridges
        func installBridges() {
            guard let webView = webView, let controller = webView.configuration.userContentController as? WKUserContentController else { return }
            controller.add(self, name: "AndroidWebSocket")
            controller.add(self, name: "AndroidUser")
            controller.addUserScript(WKUserScript(source: Self.androidShim, injectionTime: .atDocumentStart, forMainFrameOnly: true))
            controller.addUserScript(WKUserScript(source: Self.consoleShim, injectionTime: .atDocumentStart, forMainFrameOnly: true))
            controller.add(self, name: "Log")
        }

        // JS -> Native
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            switch message.name {
            case "AndroidWebSocket":
                handleWebSocket(message.body)
            case "AndroidUser":
                handleUser(message.body)
            case "Log":
                handleLog(message.body)
            default:
                break
            }
        }

        // MARK: - AndroidWebSocket API
        private func handleWebSocket(_ body: Any) {
            guard let dict = body as? [String: Any], let action = dict["action"] as? String else { return }
            switch action {
            case "connect":
                guard let urlStr = dict["url"] as? String else { return }
                let normalized = urlStr.hasPrefix("ws") ? urlStr : "ws://" + urlStr
                guard let url = URL(string: normalized) else { return }
                connect(url: url)
            case "send":
                if let message = dict["message"] as? String { send(message) }
            case "close":
                closeSocket()
            case "enterInspectionOrientation":
                setOrientation(.landscapeRight)
            case "exitInspectionOrientation":
                setOrientation(.portrait)
            case "testHttpDirect":
                if let urlStr = dict["url"] as? String { testHttpDirect(urlStr) }
            default:
                break
            }
        }

        private func connect(url: URL) {
            closeSocket()
            let task = session.webSocketTask(with: url)
            socket = task
            task.resume()
            listen()
            evaluate("window.onWebSocketOpen && window.onWebSocketOpen();")
        }

        private func listen() {
            socket?.receive { [weak self] result in
                guard let self else { return }
                switch result {
                case .failure(let error):
                    self.evaluate("window.onWebSocketError && window.onWebSocketError('\(Self.escape(error.localizedDescription))');")
                case .success(let message):
                    switch message {
                    case .string(let text):
                        let escaped = Self.escape(text)
                        self.evaluate("if(window.onWebSocketMessage){window.onWebSocketMessage('\(escaped)');}")
                    case .data:
                        break
                    @unknown default:
                        break
                    }
                    self.listen()
                }
            }
        }

        private func send(_ message: String) {
            socket?.send(.string(message)) { [weak self] error in
                if let error = error {
                    self?.evaluate("window.onWebSocketError && window.onWebSocketError('\(Self.escape(error.localizedDescription))');")
                } else {
                    self?.evaluate("console.log('✅ iOS: mensaje enviado');")
                }
            }
        }

        private func closeSocket() {
            socket?.cancel(with: .normalClosure, reason: nil)
            socket = nil
            evaluate("window.onWebSocketClose && window.onWebSocketClose(1000,'closed');")
        }

        // MARK: - AndroidUser API
        private func handleUser(_ body: Any) {
            guard let dict = body as? [String: Any], let action = dict["action"] as? String else { return }
            switch action {
            case "getUsername":
                evaluate("(function(){if(window.onGetUsername){window.onGetUsername('\(Self.escape(username))');} return '\(Self.escape(username))';})();")
            case "setUsername":
                if let name = dict["username"] as? String {
                    username = name
                    let escaped = Self.escape(name)
                    evaluate("try{localStorage.setItem('username','\(escaped)');}catch(e){};")
                }
            default:
                break
            }
        }

        // MARK: - Helpers
        private func testHttpDirect(_ urlStr: String) {
            guard let url = URL(string: urlStr) else { return }
            var req = URLRequest(url: url)
            req.timeoutInterval = 5
            URLSession.shared.dataTask(with: req) { [weak self] data, resp, err in
                let result: String
                if let err = err {
                    result = "EXCEPTION: \(err.localizedDescription)"
                } else if let http = resp as? HTTPURLResponse {
                    let snippet = String(data: data ?? Data(), encoding: .utf8) ?? ""
                    result = "HTTP \(http.statusCode) -> \(snippet.prefix(300))"
                } else {
                    result = "Sin respuesta"
                }
                let escaped = Self.escape(result)
                self?.evaluate("debugLog('🧪 testHttpDirect: \(escaped)','info');")
            }.resume()
        }

        private func setOrientation(_ orientation: UIInterfaceOrientation) {
            DispatchQueue.main.async {
                UIDevice.current.setValue(orientation.rawValue, forKey: "orientation")
                UINavigationController.attemptRotationToDeviceOrientation()
            }
        }

        private func evaluate(_ js: String) {
            DispatchQueue.main.async { [weak self] in
                self?.webView?.evaluateJavaScript(js, completionHandler: nil)
            }
        }

        // MARK: - WKNavigationDelegate
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            showLoadError(error)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            showLoadError(error)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            evaluate("console.log('✅ WebView cargada');")
        }

        private func showLoadError(_ error: Error) {
            let msg = Self.escape(error.localizedDescription)
            evaluate("document.body.innerHTML='<div style=\"font-family:Helvetica;padding:16px;color:#c00\">Carga fallida: \(msg)</div>';")
        }

        private static func escape(_ text: String) -> String {
            text
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\n")
                .replacingOccurrences(of: "\r", with: "\\r")
        }

        // Shim expone la misma API que Android para no tocar los HTML/JS existentes.
        private static let androidShim: String = {
            return """
            (function(){
                if (window.AndroidWebSocket) return;
                const post = (action, payload={}) => {
                    window.webkit?.messageHandlers?.AndroidWebSocket?.postMessage({action, ...payload});
                };
                window.AndroidWebSocket = {
                    connect: (url) => post('connect', {url}),
                    send: (message) => post('send', {message}),
                    close: () => post('close'),
                    enterInspectionOrientation: () => post('enterInspectionOrientation'),
                    exitInspectionOrientation: () => post('exitInspectionOrientation'),
                    testHttpDirect: (url) => post('testHttpDirect', {url})
                };
                const postUser = (action, payload={}) => {
                    window.webkit?.messageHandlers?.AndroidUser?.postMessage({action, ...payload});
                };
                window.AndroidUser = {
                    getUsername: () => { postUser('getUsername'); return window.__iosUsername || ''; },
                    setUsername: (username) => { window.__iosUsername = username || ''; postUser('setUsername', {username}); }
                };
            })();
            """
        }()

        // Hook de consola para ver logs en nativo
        private static let consoleShim: String = {
            return """
            (function(){
                const send = (level, msg) => {
                    window.webkit?.messageHandlers?.Log?.postMessage({ level, msg: String(msg) });
                };
                const oldLog = console.log;
                console.log = function(){ oldLog.apply(console, arguments); send('log', Array.from(arguments).join(' ')); };
                const oldErr = console.error;
                console.error = function(){ oldErr.apply(console, arguments); send('error', Array.from(arguments).join(' ')); };
                window.addEventListener('error', function(e){ send('error', e.message || e.error || 'window.onerror'); });
            })();
            """
        }()

        // Recibe logs desde JS
        func handleLog(_ body: Any) {
            guard let dict = body as? [String: Any], let msg = dict["msg"] as? String else { return }
            NSLog("[JS] %@", msg)
        }
    }
}
