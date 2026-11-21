# AI-Studio Android test app

The Android package is a Capacitor WebView wrapper that opens the hosted AI-Studio website at https://ai-studio-dileep.onrender.com. It requires internet access for the website and API-backed functions. It does not embed provider API keys.

## Build

Run the **Build AI-Studio Android APK** workflow from GitHub Actions. Download the `ai-studio-android-debug-apk` artifact from the completed workflow run. This is a debug APK for testing, not a signed Play Store release.

For a Play Store release, configure a private signing key, package identity, privacy policy, data-safety disclosures and Play Console listing. Keep signing keys and passwords in GitHub Actions secrets only.
