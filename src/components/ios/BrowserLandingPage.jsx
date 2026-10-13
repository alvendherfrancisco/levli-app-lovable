import React from "react";

const APP_STORE_URL = "https://apps.apple.com/app/id6821999710";

// The only screen a browser visitor sees (guide §2.1.2): no app, auth or paid UI.
export default function BrowserLandingPage() {
  return (
    <main className="min-h-dvh grid place-items-center p-8 text-center bg-background">
      <div className="max-w-md space-y-6">
        <h1 className="text-3xl font-semibold text-foreground">Levli</h1>
        <p className="text-muted-foreground">Your personal logbook for doses, symptoms and progress.</p>
        <a href={APP_STORE_URL} className="btn-pill btn-primary">Open in the App Store</a>
        <p className="text-xs text-muted-foreground">
          <a href="?preview=1" className="underline">Continue to web preview</a> (developers & QA only)
        </p>
      </div>
    </main>
  );
}