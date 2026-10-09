import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AmbientBackground from "@/components/onboarding/AmbientBackground";
import LevliLogo from "@/components/LevliLogo";
import LoginForm from "@/components/LoginForm";

/**
 * Signing in, drawn as the same screen as creating an account: the warm
 * ambient background, the droplet, the greeting, one white card holding the two
 * labelled fields and the two provider marks, and the screen's own action as a
 * pill below the card. The page scrolls, and its last line is kept clear of the
 * home indicator, so nothing is ever cut off on a short phone.
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
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#FAFAFA]">
      <AmbientBackground />
      <div className="auth-page-bottom relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 pt-8 sm:px-6 sm:pt-12">
        {/* A short screen sits centred; a taller one scrolls from its top, so the
            greeting is never pushed off the top to make room for the card. */}
        <div className="my-auto w-full py-6">
          <div className="mb-6 flex justify-center">
            <LevliLogo size={88} />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-800 mb-2 leading-tight">
              Glad you're here
            </h1>
            <p className="text-[15px] text-gray-500">Log in to your account</p>
          </div>

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

          <p className="mt-6 text-center text-[14px] text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}