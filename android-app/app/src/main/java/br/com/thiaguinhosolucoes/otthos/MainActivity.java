package br.com.thiaguinhosolucoes.otthos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final int PERMISSION_REQUEST_CODE = 643;
    private static final long UPDATE_CHECK_THROTTLE_MS = 30_000L;
    private static final String RELEASE_API_URL =
            "https://api.github.com/repos/tsvalencio-IA/OTTHI-World/releases/latest";
    private static final String RELEASE_DOWNLOAD_PREFIX =
            "https://github.com/tsvalencio-IA/OTTHI-World/releases/download/";

    private WebView gameWebView;
    private ProgressBar loadingProgress;
    private PermissionRequest pendingWebPermission;
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;
    private volatile long lastUpdateCheckAt = 0L;
    private int promptedVersionCode = 0;
    private boolean updateDialogVisible = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        gameWebView = findViewById(R.id.gameWebView);
        gameWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        loadingProgress = findViewById(R.id.loadingProgress);

        WebSettings settings = gameWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(gameWebView, true);

        gameWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                loadingProgress.setVisibility(View.GONE);
                refreshGameViewport();
                checkForAppUpdate(false);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    loadingProgress.setVisibility(View.GONE);
                    Toast.makeText(MainActivity.this, R.string.offline_message, Toast.LENGTH_LONG).show();
                }
            }
        });

        gameWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> requestWebPermissions(request));
            }
        });

        registerUpdateNetworkWatch();

        if (savedInstanceState == null) {
            gameWebView.loadUrl(getString(R.string.app_url));
        } else {
            gameWebView.restoreState(savedInstanceState);
        }
    }

    private void registerUpdateNetworkWatch() {
        connectivityManager = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (connectivityManager == null) {
            return;
        }
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                runOnUiThread(() -> checkForAppUpdate(false));
            }
        };
        try {
            connectivityManager.registerDefaultNetworkCallback(networkCallback);
        } catch (Exception ignored) {
            networkCallback = null;
        }
    }

    private void checkForAppUpdate(boolean force) {
        long now = System.currentTimeMillis();
        if (!force && now - lastUpdateCheckAt < UPDATE_CHECK_THROTTLE_MS) {
            return;
        }
        lastUpdateCheckAt = now;

        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                // A atualização do APK só é anunciada depois que o workflow terminou,
                // assinou e publicou o APK em uma GitHub Release. Isso evita oferecer
                // uma versão cujo arquivo ainda não existe enquanto o Pages está atualizando.
                URL url = new URL(RELEASE_API_URL + "?apk_check=" + System.currentTimeMillis());
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(8_000);
                connection.setReadTimeout(8_000);
                connection.setUseCaches(false);
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setRequestProperty("Cache-Control", "no-cache, no-store, max-age=0");
                connection.setRequestProperty("User-Agent", "OTTHI-World-Android");

                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) {
                    return;
                }

                StringBuilder jsonText = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                        connection.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        jsonText.append(line);
                    }
                }

                JSONObject release = new JSONObject(jsonText.toString());
                String tag = release.optString("tag_name", "");
                if (!tag.startsWith("apk-")) {
                    return;
                }

                int remoteVersionCode;
                try {
                    remoteVersionCode = Integer.parseInt(tag.substring(4));
                } catch (NumberFormatException invalidTag) {
                    return;
                }
                if (remoteVersionCode <= BuildConfig.VERSION_CODE || remoteVersionCode <= promptedVersionCode) {
                    return;
                }

                String apkUrl = "";
                JSONArray assets = release.optJSONArray("assets");
                if (assets != null) {
                    for (int i = 0; i < assets.length(); i++) {
                        JSONObject asset = assets.optJSONObject(i);
                        if (asset == null || !"OTTHI-WORLD.apk".equals(asset.optString("name", ""))) {
                            continue;
                        }
                        String candidate = asset.optString("browser_download_url", "");
                        if (candidate.startsWith(RELEASE_DOWNLOAD_PREFIX)) {
                            apkUrl = candidate;
                            break;
                        }
                    }
                }
                if (apkUrl.isEmpty()) {
                    return;
                }

                String releaseName = release.optString("name", "").trim();
                String displayVersion = releaseName.startsWith("OTTHI World ")
                        ? releaseName.substring("OTTHI World ".length())
                        : (releaseName.isEmpty() ? "nova versão" : releaseName);
                String finalApkUrl = apkUrl;
                runOnUiThread(() -> showUpdateDialog(remoteVersionCode, displayVersion, finalApkUrl));
            } catch (Exception ignored) {
                // Sem conexão/API indisponível: o jogo continua normalmente e tenta de novo depois.
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }, "otthi-apk-update-check").start();
    }

    private void showUpdateDialog(int remoteVersionCode, String displayVersion, String apkUrl) {
        if (isFinishing() || isDestroyed() || updateDialogVisible || remoteVersionCode <= promptedVersionCode) {
            return;
        }
        promptedVersionCode = remoteVersionCode;
        updateDialogVisible = true;

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle(R.string.update_available_title)
                .setMessage(getString(R.string.update_available_message, displayVersion))
                .setCancelable(true)
                .setPositiveButton(R.string.update_now, (ignored, which) -> openApkUpdate(apkUrl))
                .setNegativeButton(R.string.update_later, null)
                .create();
        dialog.setOnDismissListener(ignored -> updateDialogVisible = false);
        dialog.show();
    }

    private void openApkUpdate(String apkUrl) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl));
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(intent);
        } catch (Exception error) {
            Toast.makeText(this, R.string.update_open_error, Toast.LENGTH_LONG).show();
        }
    }

    private void refreshGameViewport() {
        if (gameWebView == null) {
            return;
        }
        Runnable refresh = () -> {
            gameWebView.requestLayout();
            gameWebView.invalidate();
            gameWebView.evaluateJavascript(
                    "window.OTTHI_VIEWPORT?.measure?.();window.dispatchEvent(new Event('orientationchange'));",
                    null
            );
        };
        gameWebView.post(refresh);
        gameWebView.postDelayed(refresh, 140);
        gameWebView.postDelayed(refresh, 420);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        refreshGameViewport();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshGameViewport();
        checkForAppUpdate(false);
    }

    private void requestWebPermissions(PermissionRequest request) {
        List<String> missing = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                missing.add(Manifest.permission.CAMERA);
            }
        }

        if (missing.isEmpty()) {
            request.grant(request.getResources());
            return;
        }

        pendingWebPermission = request;
        requestPermissions(missing.toArray(new String[0]), PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != PERMISSION_REQUEST_CODE || pendingWebPermission == null) {
            return;
        }

        boolean allGranted = true;
        for (int result : grantResults) {
            if (result != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (allGranted) {
            pendingWebPermission.grant(pendingWebPermission.getResources());
        } else {
            pendingWebPermission.deny();
        }
        pendingWebPermission = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        gameWebView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (gameWebView.canGoBack()) {
            gameWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (connectivityManager != null && networkCallback != null) {
            try {
                connectivityManager.unregisterNetworkCallback(networkCallback);
            } catch (Exception ignored) {
                // Já removido pelo Android.
            }
        }
        if (gameWebView != null) {
            gameWebView.stopLoading();
            gameWebView.destroy();
        }
        super.onDestroy();
    }
}
