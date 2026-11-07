package com.priism.skins

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import com.google.android.material.floatingactionbutton.FloatingActionButton

/**
 * Priism Skins Android shell.
 *
 * A full-screen WebView opens tradingview.com/chart and injects the SAME skin code used by the browser
 * extension and desktop app (assets/shared/src/{hook,skins,content}.js + content.css). A second WebView
 * shows the shared settings popup (assets/shared/popup/popup.html). Settings live in SharedPreferences as
 * one JSON object `cfg`; changes are pushed into the chart live via window.__bdUpdate — exactly like desktop.
 */
class MainActivity : Activity() {

    private lateinit var root: FrameLayout
    private lateinit var chart: WebView
    private var settings: WebView? = null
    private lateinit var store: Store

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        store = Store(this)
        root = FrameLayout(this)
        setContentView(root)

        chart = WebView(this)
        root.addView(chart, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        WebView.setWebContentsDebuggingEnabled(true)

        with(chart.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            userAgentString = userAgentString.replace("; wv", "") // some sites block the "wv" WebView UA
        }
        // Bridge the chart page can call to read/write settings and open the settings sheet.
        chart.addJavascriptInterface(Bridge(), "PriismNative")

        chart.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                // hook.js must run before TradingView paints (it wraps the canvas API).
                view.evaluateJavascript(asset("shared/src/candlelooks.js") + "\n" + asset("shared/src/hook.js"), null)
            }
            override fun onPageFinished(view: WebView, url: String?) {
                injectSkins(view)
            }
            // keep navigation inside TradingView; everything else goes to the system browser
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val host = req.url.host ?: return false
                return if (host.endsWith("tradingview.com")) false
                else { startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, req.url)); true }
            }
        }
        chart.loadUrl("https://www.tradingview.com/chart/")

        addFab()
    }

    private fun injectSkins(view: WebView) {
        val css = asset("shared/src/content.css").replace("\\", "\\\\").replace("`", "\\`").replace("$", "\\$")
        val cfg = store.json()
        val js = buildString {
            append("(function(){")
            append("var s=document.createElement('style');s.textContent=`").append(css).append("`;document.documentElement.appendChild(s);")
            append("window.__BD_CFG=").append(cfg).append(";")
            append("if(window.__bdUpdate){window.__bdUpdate(window.__BD_CFG);}else{")
            append(asset("shared/src/skins.js")).append("\n")
            append(asset("shared/src/content.js"))
            append("}})();")
        }
        view.evaluateJavascript(js, null)
    }

    /** Push a settings change into the live chart. */
    private fun pushToChart(obj: String) {
        chart.evaluateJavascript("window.__bdUpdate && window.__bdUpdate($obj)", null)
    }

    // ---------- settings sheet (shared popup) ----------
    @SuppressLint("SetJavaScriptEnabled")
    private fun openSettings() {
        if (settings != null) return
        val wv = WebView(this)
        wv.settings.javaScriptEnabled = true
        wv.settings.domStorageEnabled = true
        wv.addJavascriptInterface(Bridge(), "PriismNative")
        // popup.html expects window.chrome.storage; the shim (priism-android.js) provides it from PriismNative.
        wv.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String?) {
                view.evaluateJavascript(asset("shared/popup/priism-android.js"), null)
            }
            // web links (Workshop website, Share my look) open in the phone's browser
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val s = req.url.scheme ?: return false
                return if (s == "http" || s == "https") { openUrl(req.url.toString()); true } else false
            }
        }
        wv.settings.allowFileAccess = true
        wv.loadUrl("file:///android_asset/shared/popup/popup.html")
        val lp = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        root.addView(wv, lp)
        settings = wv
    }

    private fun closeSettings() {
        settings?.let { root.removeView(it); it.destroy() }
        settings = null
    }

    override fun onBackPressed() {
        when {
            settings != null -> closeSettings()
            chart.canGoBack() -> chart.goBack()
            else -> super.onBackPressed()
        }
    }

    /** Floating button to open/close settings. */
    private fun addFab() {
        val fab = FloatingActionButton(this)
        fab.setImageResource(android.R.drawable.ic_menu_manage)
        fab.contentDescription = "Priism Skins settings"
        val lp = FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        lp.gravity = android.view.Gravity.BOTTOM or android.view.Gravity.END
        lp.setMargins(0, 0, 36, 120)
        root.addView(fab, lp)
        fab.setOnClickListener { if (settings == null) openSettings() else closeSettings() }
    }

    private fun openUrl(url: String) {
        if (!url.startsWith("https://") && !url.startsWith("http://")) return
        try { startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))) } catch (_: Exception) {}
    }

    private fun asset(path: String): String =
        assets.open(path).bufferedReader().use { it.readText() }

    /** JS bridge shared by both WebViews. */
    inner class Bridge {
        @JavascriptInterface fun get(): String = store.json()
        @JavascriptInterface fun set(obj: String) {
            store.merge(obj)
            runOnUiThread { pushToChart(obj) }
        }
        @JavascriptInterface fun closeSettings() = runOnUiThread { this@MainActivity.closeSettings() }
        @JavascriptInterface fun openUrl(url: String) = runOnUiThread { this@MainActivity.openUrl(url) }
    }
}
