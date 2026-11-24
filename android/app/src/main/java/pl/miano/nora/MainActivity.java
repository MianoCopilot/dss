package pl.miano.nora;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String PREFS = "nora";
    private static final String KEY_URL = "url";

    private WebView web;
    private LinearLayout gate;
    private EditText urlField;
    private ProgressBar progress;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        setContentView(buildUi());
        String saved = prefs.getString(KEY_URL, "");
        if (saved != null && !saved.isEmpty()) {
            open(saved);
        }
    }

    private View buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setVisibility(View.GONE);
        root.addView(progress, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        gate = new LinearLayout(this);
        gate.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(24);
        gate.setPadding(pad, pad, pad, pad);

        TextView intro = new TextView(this);
        intro.setText(R.string.intro);
        intro.setTextSize(18);
        gate.addView(intro);

        urlField = new EditText(this);
        urlField.setHint(R.string.url_hint);
        urlField.setSingleLine(true);
        LinearLayout.LayoutParams fieldParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        fieldParams.topMargin = dp(16);
        gate.addView(urlField, fieldParams);

        Button open = new Button(this);
        open.setText(R.string.open);
        open.setOnClickListener(v -> {
            String raw = urlField.getText().toString().trim();
            if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
                raw = "https://" + raw;
            }
            prefs.edit().putString(KEY_URL, raw).apply();
            open(raw);
        });
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        buttonParams.topMargin = dp(12);
        gate.addView(open, buttonParams);
        root.addView(gate, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        web = new WebView(this);
        setupWeb(web);
        web.setVisibility(View.GONE);
        root.addView(web, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        return root;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWeb(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        view.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setVisibility(newProgress == 100 ? View.GONE : View.VISIBLE);
                progress.setProgress(newProgress);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
        view.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return uri == null || !(uri.getScheme().equals("https") || uri.getScheme().equals("http"));
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
            }
        });
    }

    private void open(String url) {
        gate.setVisibility(View.GONE);
        web.setVisibility(View.VISIBLE);
        web.loadUrl(url);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onBackPressed() {
        if (web.getVisibility() == View.VISIBLE && web.canGoBack()) {
            web.goBack();
            return;
        }
        if (web.getVisibility() == View.VISIBLE) {
            web.setVisibility(View.GONE);
            gate.setVisibility(View.VISIBLE);
            return;
        }
        super.onBackPressed();
    }
}
