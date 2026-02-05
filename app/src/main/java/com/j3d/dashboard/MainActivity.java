package com.j3d.dashboard;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.JavascriptInterface;
import androidx.appcompat.app.AppCompatActivity;
import java.net.URI;
import java.nio.ByteBuffer;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.java_websocket.framing.Framedata;
import android.webkit.ValueCallback;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import android.content.pm.ActivityInfo;
import android.view.View;
import android.content.res.Configuration;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private WebSocketClient webSocketClient;
    private String loggedUsername = "";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        
        // Configurar WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setLoadsImagesAutomatically(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        
        // Configuración para ajustar contenido a la pantalla
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        // Mostrar todo el ancho inicial (zoom out)
        webSettings.setSupportZoom(false);
        webView.setInitialScale(80); // 80% para ver la MainBar completa
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        
        // Enable debugging
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        
        // Agregar interfaz JavaScript para WebSocket
        webView.addJavascriptInterface(new WebSocketInterface(), "AndroidWebSocket");
        // Exponer interfaz para usuario (username)
        webView.addJavascriptInterface(new UserInterface(), "AndroidUser");
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return false;
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                view.evaluateJavascript("debugLog('❌ WebView error: " + description.replace("'","\\'") + "','error')", null);
            }
        });
        
        webView.setWebChromeClient(new WebChromeClient());
        
        // Cargar versión simple para debugging
        webView.loadUrl("file:///android_asset/J3DDashBoard.html");
        // Si ya tenemos username conocido, inyectarlo a localStorage al cargar
        if (loggedUsername != null && !loggedUsername.isEmpty()) {
            final String js = "try{localStorage.setItem('username','" + loggedUsername.replace("'","\\'") + "');}catch(e){}";
            webView.evaluateJavascript(js, null);
        }
    }

    private void setOrientationLandscape() {
        // SENSOR_LANDSCAPE permite rotar entre landscape normal y reverso automáticamente
        runOnUiThread(() -> setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE));
    
    }

    private void setOrientationPortrait() {
        runOnUiThread(() -> setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
    }

    private class WebSocketInterface {
        @JavascriptInterface
        public void connect(String serverUrl) {
            try {
                URI serverUri = URI.create(serverUrl);
                webSocketClient = new WebSocketClient(serverUri) {
                    @Override
                    public void onOpen(ServerHandshake handshake) {
                        runOnUiThread(() -> {
                            webView.evaluateJavascript("window.onWebSocketOpen && window.onWebSocketOpen();", null);
                        });
                    }

                    @Override
                    public void onMessage(String message) {
                        // Log nativo de Android para debugging
                        android.util.Log.d("J3D_WEBSOCKET", "📨 MENSAJE RECIBIDO: " + message);
                        
                        runOnUiThread(() -> {
                            // Debug directo en consola del navegador
                            webView.evaluateJavascript("console.log('🔥 JAVA RECIBIÓ: " + 
                                message.replace("'", "\\'").replace("\n", " ") + "');", null);
                            
                            // Escapar correctamente el mensaje para JavaScript
                            String escapedMessage = message
                                .replace("\\", "\\\\")  // Escapar backslashes primero
                                .replace("'", "\\'")    // Escapar comillas simples
                                .replace("\"", "\\\"")  // Escapar comillas dobles
                                .replace("\n", "\\n")   // Escapar saltos de línea
                                .replace("\r", "\\r")   // Escapar retornos de carro
                                .replace("\t", "\\t");  // Escapar tabulaciones
                            
                            String jsCode = "if (window.onWebSocketMessage) { " +
                                          "try { " +
                                          "console.log('🚀 LLAMANDO onWebSocketMessage...'); " +
                                          "window.onWebSocketMessage('" + escapedMessage + "'); " +
                                          "console.log('✅ onWebSocketMessage ejecutado correctamente'); " +
                                          "} catch (e) { " +
                                          "console.error('💥 ERROR en onWebSocketMessage:', e); " +
                                          "console.error('📨 Mensaje que causó error:', '" + escapedMessage + "'); " +
                                          "} " +
                                          "} else { " +
                                          "console.error('❌ window.onWebSocketMessage NO EXISTE'); " +
                                          "}";
                            
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }

                    @Override
                    public void onWebsocketPing(org.java_websocket.WebSocket conn, Framedata f) {
                        // Log para debugging
                        android.util.Log.d("J3D_WEBSOCKET", "🏓 PING recibido del servidor");
                        runOnUiThread(() -> {
                            webView.evaluateJavascript("console.log('🏓 PING recibido del servidor');", null);
                        });
                        
                        // Responder automáticamente con PONG
                        super.onWebsocketPing(conn, f);
                    }

                    @Override
                    public void onWebsocketPong(org.java_websocket.WebSocket conn, Framedata f) {
                        // Log para debugging
                        android.util.Log.d("J3D_WEBSOCKET", "🏓 PONG enviado al servidor");
                        runOnUiThread(() -> {
                            webView.evaluateJavascript("console.log('🏓 PONG enviado al servidor');", null);
                        });
                    }

                    @Override
                    public void onClose(int code, String reason, boolean remote) {
                        android.util.Log.d("J3D_WEBSOCKET", "🔌 CONEXIÓN CERRADA: " + code + " - " + reason);
                        runOnUiThread(() -> {
                            webView.evaluateJavascript("console.log('🔌 CONEXIÓN CERRADA: " + code + " - " + reason + "');", null);
                            webView.evaluateJavascript("window.onWebSocketClose && window.onWebSocketClose(" + code + ", '" + reason + "');", null);
                        });
                    }

                    @Override
                    public void onError(Exception ex) {
                        runOnUiThread(() -> {
                            webView.evaluateJavascript("window.onWebSocketError && window.onWebSocketError('" + ex.getMessage() + "');", null);
                        });
                    }
                };
                webSocketClient.connect();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void send(String message) {
            if (webSocketClient != null && webSocketClient.isOpen()) {
                webSocketClient.send(message);
                
                // Debug: confirmar envío
                runOnUiThread(() -> {
                    webView.evaluateJavascript("console.log('✅ JAVA: Mensaje enviado al servidor: " + 
                        message.replace("'", "\\'") + "');", null);
                });
            } else {
                // Debug: error de envío
                runOnUiThread(() -> {
                    webView.evaluateJavascript("console.log('❌ JAVA: No se pudo enviar - WebSocket cerrado');", null);
                });
            }
        }

        @JavascriptInterface
        public void close() {
            if (webSocketClient != null) {
                webSocketClient.close();
            }
        }

        @JavascriptInterface
        public void testHttpDirect(String urlStr) {
            new Thread(() -> {
                String result;
                try {
                    URL url = new URL(urlStr);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(5000);
                    conn.setRequestMethod("GET");
                    conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
                    conn.setRequestProperty("User-Agent", "AndroidWebView-J3D");
                    int code = conn.getResponseCode();
                    BufferedReader br = new BufferedReader(new InputStreamReader(
                        code >= 200 && code < 400 ? conn.getInputStream() : conn.getErrorStream()
                    ));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null && sb.length() < 500) {
                        sb.append(line).append('\n');
                    }
                    br.close();
                    result = "HTTP " + code + " -> " + sb.toString().replace("'"," ").replace("\\"," ");
                } catch (Exception ex) {
                    result = "EXCEPTION: " + ex.getClass().getSimpleName() + " - " + ex.getMessage();
                }
                String js = "debugLog('🧪 testHttpDirect: " + result + "','info')";
                runOnUiThread(() -> webView.evaluateJavascript(js, null));
            }).start();
        }

        @JavascriptInterface
        public void enterInspectionOrientation() {
            setOrientationLandscape();
        }

        @JavascriptInterface
        public void exitInspectionOrientation() {
            setOrientationPortrait();
        }
    }

    // Interfaz JS para exponer/recibir el username del login nativo
    private class UserInterface {
        @JavascriptInterface
        public String getUsername() {
            return loggedUsername == null ? "" : loggedUsername;
        }

        @JavascriptInterface
        public void setUsername(String username) {
            loggedUsername = username == null ? "" : username;
            // Persistir en localStorage para el contexto web
            final String js = "try{localStorage.setItem('username','" + (loggedUsername.replace("'","\\'")) + "');}catch(e){}";
            runOnUiThread(() -> webView.evaluateJavascript(js, null));
        }
    }

    // Método público para que otras Activities/servicios fijen el username tras login
    public void setLoggedUsername(String username) {
        loggedUsername = username == null ? "" : username;
        final String js = "try{localStorage.setItem('username','" + (loggedUsername.replace("'","\\'")) + "');}catch(e){}";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webSocketClient != null) {
            webSocketClient.close();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // Do nothing special to avoid recreating activity and reloading WebView
        // Keep WebView state as-is
    }
}