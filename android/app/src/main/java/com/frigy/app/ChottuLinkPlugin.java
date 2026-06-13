package com.frigy.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.chottulink.lib.ChottuLink;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@CapacitorPlugin(name = "ChottuLink")
public class ChottuLinkPlugin extends Plugin {

    private static final String TAG = "ChottuLinkPlugin";

    @Override
    public void load() {
        super.load();
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        String apiKey = call.getString("apiKey");
        boolean debug = Boolean.TRUE.equals(call.getBoolean("debug", false));

        if (apiKey == null || apiKey.trim().isEmpty()) {
            call.reject("apiKey is required");
            return;
        }

        try {
            ChottuLink.init(getContext(), apiKey.trim());

            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    if (ChottuLink.isInitialized()) {
                        JSObject payload = new JSObject();
                        payload.put("apiKey", apiKey.trim());
                        notifyListeners("initializationSuccess", payload, true);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Initialization state check failed", e);
                }
            }, debug ? 750 : 3000);

            handleDynamicLink(getActivity() != null ? getActivity().getIntent() : null);
            call.resolve();
        } catch (Exception error) {
            Log.e(TAG, "Failed to initialize ChottuLink", error);
            call.reject(error.getMessage(), error);
        }
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        handleDynamicLink(intent);
    }

    @PluginMethod
    public void handleLink(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("url is required");
            return;
        }

        try {
            handleDynamicLink(Uri.parse(url.trim()), url.trim());
            call.resolve();
        } catch (Exception error) {
            Log.e(TAG, "Failed to handle link", error);
            call.reject(error.getMessage(), error);
        }
    }

    @PluginMethod
    public void getAppLinkDataFromUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("url is required");
            return;
        }

        try {
            Uri uri = Uri.parse(url.trim());
            ChottuLink.getAppLinkDataFromUri(uri)
                .addOnSuccessListener(result -> {
                    if (result == null) {
                        call.reject("No app link data found");
                        return;
                    }

                    JSObject payload = new JSObject();
                    payload.put("link", result.getLink() != null ? result.getLink().toString() : null);
                    payload.put("shortLink", result.getShortLink() != null ? result.getShortLink().toString() : null);
                    call.resolve(payload);
                })
                .addOnFailureListener(error -> call.reject(error.getMessage(), error));
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }

    @PluginMethod
    public void identify(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.trim().isEmpty()) {
            call.reject("id is required");
            return;
        }

        try {
            ChottuLink.CustomerMeta.Builder builder = new ChottuLink.CustomerMeta.Builder();
            builder.setId(id.trim());
            if (call.getString("name") != null) builder.setName(call.getString("name"));
            if (call.getString("email") != null) builder.setEmail(call.getString("email"));
            if (call.getString("phone") != null) builder.setPhone(call.getString("phone"));
            if (call.getString("emailSha256") != null) builder.setEmailSha256(call.getString("emailSha256"));
            if (call.getString("phoneSha256") != null) builder.setPhoneSha256(call.getString("phoneSha256"));
            ChottuLink.identify(builder.build());
            call.resolve();
        } catch (Exception error) {
            Log.e(TAG, "identify failed", error);
            call.reject(error.getMessage(), error);
        }
    }

    @PluginMethod
    public void trackConversion(PluginCall call) {
        Double revenue = call.getDouble("revenue");
        if (revenue == null || revenue <= 0) {
            call.reject("revenue is required");
            return;
        }

        try {
            ChottuLink.ConversionMeta.Builder builder = new ChottuLink.ConversionMeta.Builder();
            builder.setRevenue(revenue);
            if (call.getString("currency") != null) builder.setCurrency(call.getString("currency"));
            builder.setEventName(call.getString("eventName", "conversion"));
            if (call.getString("productId") != null) builder.setProductId(call.getString("productId"));
            if (call.getString("transactionId") != null) builder.setTransactionId(call.getString("transactionId"));
            JSObject metadata = call.getObject("metadata");
            if (metadata != null) builder.setMetadata(jsonObjectToMap(metadata));
            ChottuLink.trackConversion(builder.build());
            call.resolve();
        } catch (Exception error) {
            Log.e(TAG, "trackConversion failed", error);
            call.reject(error.getMessage(), error);
        }
    }

    @PluginMethod
    public void trackEvent(PluginCall call) {
        String name = call.getString("name");
        if (name == null || name.trim().isEmpty()) {
            call.reject("name is required");
            return;
        }

        try {
            JSObject data = call.getObject("data");
            Map<String, Object> map = data != null ? jsonObjectToMap(data) : null;
            ChottuLink.trackEvent(name.trim(), map);
            call.resolve();
        } catch (Exception error) {
            Log.e(TAG, "trackEvent failed", error);
            call.reject(error.getMessage(), error);
        }
    }

    private Map<String, Object> jsonObjectToMap(JSONObject obj) {
        Map<String, Object> map = new HashMap<>();
        if (obj == null) return map;

        Iterator<String> keys = obj.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            map.put(key, obj.opt(key));
        }
        return map;
    }

    private void handleDynamicLink(Intent intent) {
        final String originalUrl = intent != null && intent.getData() != null
            ? intent.getData().toString()
            : null;

        try {
            ChottuLink.getAppLinkData(intent)
                .addOnSuccessListener(result -> {
                    if (result == null || result.getLink() == null) {
                        notifyDeepLinkFailed(originalUrl, "No dynamic link found", 1002);
                        return;
                    }

                    notifyDeepLinkResolved(result.getLink().toString(), new JSObject());
                })
                .addOnFailureListener(error -> notifyDeepLinkFailed(
                    originalUrl,
                    error.getLocalizedMessage() != null ? error.getLocalizedMessage() : "Unknown error",
                    1003
                ));
        } catch (Exception error) {
            notifyDeepLinkFailed(
                originalUrl,
                error.getLocalizedMessage() != null ? error.getLocalizedMessage() : "Unknown exception",
                1004
            );
        }
    }

    private void handleDynamicLink(Uri uri, String originalUrl) {
        try {
            ChottuLink.getAppLinkDataFromUri(uri)
                .addOnSuccessListener(result -> {
                    if (result == null || result.getLink() == null) {
                        notifyDeepLinkFailed(originalUrl, "No dynamic link found", 1002);
                        return;
                    }

                    notifyDeepLinkResolved(result.getLink().toString(), new JSObject());
                })
                .addOnFailureListener(error -> notifyDeepLinkFailed(
                    originalUrl,
                    error.getLocalizedMessage() != null ? error.getLocalizedMessage() : "Unknown error",
                    1003
                ));
        } catch (Exception error) {
            notifyDeepLinkFailed(
                originalUrl,
                error.getLocalizedMessage() != null ? error.getLocalizedMessage() : "Unknown exception",
                1004
            );
        }
    }

    private void notifyDeepLinkResolved(String url, JSObject metadata) {
        JSObject payload = new JSObject();
        payload.put("url", url);
        payload.put("metadata", metadata);
        notifyListeners("deepLinkResolved", payload, true);
    }

    private void notifyDeepLinkFailed(String originalUrl, String message, int errorCode) {
        JSObject payload = new JSObject();
        payload.put("originalUrl", originalUrl);
        payload.put("error", message);
        payload.put("errorCode", errorCode);
        notifyListeners("deepLinkFailed", payload, true);
    }
}
