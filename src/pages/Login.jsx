import React, { useState } from "react";
import { Link } from "react-router-dom";
import { isRunningInIOSWrapper } from "@/lib/iosBridge";
import { base44 } from "@/api/base44Client";
import AuthScreen from "@/components/auth/AuthScreen";
import LoginForm from "@/components/LoginForm";
import { AUTH_BODY, AUTH_LINK } from "@/lib/authStyles";

/**
 * Signing in, drawn as the same screen as creating an account: the ambient
 * background, the droplet, the greeting, one card holding the two labelled fields
 * and the two provider marks, and the screen's own action as a pill below the
 * card.
 *
 * The whole screen follows the device's own light/dark setting — see AuthScreen
 * and src/lib/authStyles.js — so no part of it is painted in a fixed white or
 * grey. The page scrolls, and its last line is kept clear of the home indicator,
 * so nothing is ever cut off on a short phone.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getSafeRedirect = () => {
    const fromUrl = new URLSearchParams(window.location.search).get("from_url");
    if (fromUrl && fromUrl.startsWith("/") && !fromUrl.startsWith("/login") && !fromUrl.startsWith("/register")) {
      return fromUrl;
    }
    return "/";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      // Replace rather than push. Pushing leaves the sign-in page in the history
      // directly behind the app, so the first in-app step back — the shell's own
      // history bookkeeping, the hardware back button, a swipe — can leave the
      // app's route and re-open the login page. That leftover entry is the only
      // difference between the session that begins right after signing in and a
      // fresh launch, which is why a restart behaves and this one did not.
      window.location.replace(getSafeRedirect());
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleProvider = (provider) => {
    base44.auth.loginWithProvider(provider, getSafeRedirect());
  };

  return (
    <AuthScreen title="Glad you're here" subtitle="Log in to your account">
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        onProvider={handleProvider}
      />

      {!isRunningInIOSWrapper() && (
        <p className={`mt-6 text-center ${AUTH_BODY}`}>
          Don't have an account?{" "}
          <Link to="/register" className={AUTH_LINK}>
            Create one
          </Link>
        </p>
      )}
    </AuthScreen>
  );
}