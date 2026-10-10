import React, { useState } from "react";
import { X, Syringe, BarChart3, History, FileText, Droplet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAppState } from "@/lib/AppState";
import useModal from "@/hooks/useModal";
import { toast } from "@/lib/toast";

const PLANS = [
  { id: "monthly", name: "Monthly", desc: "Full access for just ₱125.00/month" },
  { id: "yearly", name: "Yearly", desc: "First 1 week free, then ₱509.00/year (₱42.41/month)", badge: "66% OFF" },
  { id: "lifetime", name: "Lifetime", desc: "Lifetime access for just ₱1,010.00", badge: "Popular" },
];

const FEATURES = [
  { icon: Syringe, label: "Track Unlimited Shots" },
  { icon: BarChart3, label: "Unlock Comprehensive Insights" },
  { icon: History, label: "Unlock Complete History" },
  { icon: FileText, label: "Generate & Share Reports" },
  { icon: Droplet, label: "Remove Ads and Watermarks" },
];

export default function PaywallModal({ open, onClose }) {
  const { user } = useAuth();
  const { refreshProfile } = useAppState();
  const [selected, setSelected] = useState("yearly");
  const [busy, setBusy] = useState(false);
  const [showNoSub, setShowNoSub] = useState(false);

  const sheetRef = useModal({ open, onDismiss: onClose });

  if (!open) return null;

  const handleCheckout = async () => {
    // In a framed preview the checkout page must open in its own tab, and the
    // tab has to be opened in the click handler so the popup is not blocked.
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open("", "_blank") : null;
    if (isFramed && !checkoutTab) {
      toast.error("Allow popups to continue to checkout.");
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("create-checkout-session", {
        plan: selected,
        userId: user?.id,
        email: user?.email,
        appOrigin: window.location.origin,
      });
      if (res.data?.url) {
        if (checkoutTab) checkoutTab.location.replace(res.data.url);
        else window.location.assign(res.data.url);
      } else {
        checkoutTab?.close();
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (e) {
      console.error(e);
      checkoutTab?.close();
      toast.error("Checkout failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("verify-payment", { userId: user?.id });
      if (res.data?.granted) {
        toast.success("Premium restored!");
        refreshProfile?.();
        onClose();
      } else {
        setShowNoSub(true);
      }
    } catch (e) {
      setShowNoSub(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Levli Premium" tabIndex={-1} className="fixed inset-0 z-[70] bg-white flex flex-col overflow-x-hidden sheet-lock animate-in slide-in-from-bottom outline-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <button onClick={handleRestore} className="text-sm text-gray-500 hover:text-indigo-600">Restore</button>
        <button onClick={onClose} aria-label="Close"><X size={22} className="text-gray-400" /></button>
      </div>

      {/* Scrollable content — scrollbar hidden */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="text-center mt-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Be Consistent. Be Healthier</h2>
          <p className="text-sm text-gray-500 mt-2">Your Health Deserves The Full Experience. – Go Premium!</p>
        </div>

        {/* Plan cards */}
        <div className="space-y-3 mb-6">
          {PLANS.map((p) => (
            <button key={p.id} onClick={() => setSelected(p.id)}
              className={`w-full text-left rounded-2xl p-4 border transition-colors ${
                selected === p.id ? "border-indigo-600 bg-indigo-50" : "border-cardline bg-white"
              }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-lg">{p.name}</span>
                {p.badge && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    p.badge === "Popular" ? "bg-indigo-600 text-white" : "bg-amber-100 text-amber-700"
                  }`}>{p.badge}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{p.desc}</p>
            </button>
          ))}
        </div>

        {/* Feature grid */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                  <f.icon size={20} className="text-indigo-600" />
                </div>
                <span className="text-[11px] text-gray-600 leading-tight">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fine print */}
        <p className="text-[11px] text-gray-400 text-center mt-4 px-2">
          No commitment, cancel anytime from your account settings. Payment is charged to your account via Stripe.
        </p>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-400 flex-wrap">
          <a href="/terms" className="hover:text-indigo-600">Terms of Service</a>
          <span>·</span>
          <button onClick={handleRestore} className="hover:text-indigo-600">Restore Purchase</button>
          <span>·</span>
          <a href="/privacy" className="hover:text-indigo-600">Privacy Policy</a>
        </div>
      </div>

      {/* Continue button pinned bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-white to-transparent">
        <button onClick={handleCheckout} disabled={busy}
          className="w-full py-4 btn-pill btn-primary font-bold text-lg disabled:opacity-60">
          {busy ? "Please wait…" : "Continue"}
        </button>
      </div>

      {/* No Subscription Found modal */}
      {showNoSub && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">No Subscription Found</h3>
            <p className="text-sm text-gray-500 mt-2">We couldn't find an active subscription for your account.</p>
            <button onClick={() => setShowNoSub(false)}
              className="mt-5 w-full py-3 btn-pill btn-primary font-semibold">
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}