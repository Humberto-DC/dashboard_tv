package com.conecta360.dashboardtv;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

// Importação explícita do R caso o Gradle esteja rigoroso
import com.conecta360.dashboardtv.R;

public class MainActivity extends BridgeActivity {
    private View errorView;
    private boolean isErrorShowing = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        
        Window window = getWindow();
        window.setFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);

        setupErrorHandling();
    }

    private void setupErrorHandling() {
        final WebView webView = getBridge().getWebView();
        if (webView == null) return;

        // Sobrescreve o cliente do WebView para detectar erros
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                // Apenas erros na URL principal
                if (request.isForMainFrame()) {
                    showErrorPage();
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (!isErrorShowing) {
                    hideErrorPage();
                }
            }
        });
    }

    private void showErrorPage() {
        if (isErrorShowing) return;
        isErrorShowing = true;

        runOnUiThread(() -> {
            if (errorView == null) {
                errorView = getLayoutInflater().inflate(R.layout.error_layout, null);
                Button btnRetry = errorView.findViewById(R.id.btn_retry);
                btnRetry.setOnClickListener(v -> {
                    isErrorShowing = false;
                    hideErrorPage();
                    getBridge().getWebView().reload();
                });
            }

            // Adiciona a view de erro por cima do WebView
            ViewGroup rootView = (ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content);
            if (errorView != null && errorView.getParent() == null) {
                rootView.addView(errorView);
            }
        });
    }

    private void hideErrorPage() {
        isErrorShowing = false;
        runOnUiThread(() -> {
            if (errorView != null && errorView.getParent() != null) {
                ViewGroup rootView = (ViewGroup) errorView.getParent();
                rootView.removeView(errorView);
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        final WebView webView = getBridge().getWebView();
        if (webView != null) {
            String currentUrl = webView.getUrl();
            if (currentUrl == null || !currentUrl.contains("/mobile")) {
                webView.loadUrl("http://conecta360.test:3000/mobile");
            }
        }
    }
}
