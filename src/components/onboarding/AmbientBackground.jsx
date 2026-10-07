import React from "react";

/**
 * Ambient gradient blob background for onboarding.
 * Subtle, low-opacity, slow-drifting decorative blobs.
 */
export default function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-24 -left-20 w-80 h-80 rounded-full blur-3xl animate-ambient-1"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-24 w-96 h-96 rounded-full blur-3xl animate-ambient-2"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.15), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-32 left-10 w-80 h-80 rounded-full blur-3xl animate-ambient-3"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%)" }}
      />
    </div>
  );
}