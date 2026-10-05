import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Check, Trash2, X } from "lucide-react";
import { dismissToast, subscribeToast } from "@/lib/toast";

// Each type brings its own icon, tint and accent, so what the card means never
// rests on colour alone.
const TYPES = {
  success: { Icon: Check, circle: "bg-green-500/20 text-green-400", border: "border-green-500/30", bar: "bg-green-400/70" },
  deleted: { Icon: Trash2, circle: "bg-white/10 text-gray-300", border: "border-white/15", bar: "bg-white/40" },
  warning: { Icon: AlertTriangle, circle: "bg-amber-500/20 text-amber-400", border: "border-amber-500/30", bar: "bg-amber-400/70" },
  error: { Icon: AlertCircle, circle: "bg-red-500/20 text-red-400", border: "border-red-500/30", bar: "bg-red-400/70" },
};

const EXIT_MS = 200;
const SWIPE_UP_PX = 40;

/**
 * The app's only toast: one at a time, docked just under the status bar. It
 * slides in from the top, runs its own timer (held while a finger is on it) and
 * can be flicked up or closed with the X.
 */
export default function ToastHost() {
  const [shown, setShown] = useState(null);
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [actionExpired, setActionExpired] = useState(false);

  const shownRef = useRef(null);
  const dismissRef = useRef(() => {});
  const exitTimerRef = useRef(null);
  const autoTimerRef = useRef(null);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(0);
  const pausedRef = useRef(false);
  const dragStartRef = useRef(null);
  const dragYRef = useRef(0);

  // A new toast takes the place of the one on screen — nothing is queued.
  useEffect(() => subscribeToast((next) => {
    if (!next) return;
    if (exitTimerRef.current) { clearTimeout(exitTimerRef.current); exitTimerRef.current = null; }
    shownRef.current = next;
    pausedRef.current = false;
    setClosing(false);
    setEntered(false);
    setPaused(false);
    setDragging(false);
    setDragY(0);
    setActionExpired(false);
    setShown(next);
  }), []);

  const dismiss = () => {
    const leaving = shownRef.current;
    if (!leaving || exitTimerRef.current) return;
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    pausedRef.current = false;
    setPaused(false);
    setClosing(true);
    dismissToast(leaving.id);
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      setClosing(false);
      setDragging(false);
      setDragY(0);
      dragYRef.current = 0;
      if (shownRef.current && shownRef.current.id === leaving.id) shownRef.current = null;
      setShown((active) => (active && active.id === leaving.id ? null : active));
    }, EXIT_MS);
  };
  useEffect(() => { dismissRef.current = dismiss; });

  // The countdown. An error carries no duration, so it waits to be dismissed.
  useEffect(() => {
    if (!shown || shown.duration == null) return;
    remainingRef.current = shown.duration;
    startedAtRef.current = Date.now();
    autoTimerRef.current = window.setTimeout(() => dismissRef.current(), shown.duration);
    return () => {
      if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    };
  }, [shown]);

  // An Undo is offered for a short window, so it disappears before the card does.
  useEffect(() => {
    if (!shown?.actionTtlMs) return;
    const timer = window.setTimeout(() => setActionExpired(true), shown.actionTtlMs);
    return () => clearTimeout(timer);
  }, [shown]);

  const pauseTimer = () => {
    const active = shownRef.current;
    if (!active || active.duration == null || !autoTimerRef.current) return;
    clearTimeout(autoTimerRef.current);
    autoTimerRef.current = null;
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
    pausedRef.current = true;
    setPaused(true);
  };

  const resumeTimer = () => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    const active = shownRef.current;
    if (!active || active.duration == null || exitTimerRef.current) return;
    startedAtRef.current = Date.now();
    autoTimerRef.current = window.setTimeout(() => dismissRef.current(), Math.max(0, remainingRef.current));
  };

  const handlePointerDown = (event) => {
    // Holding the pointer keeps the timer still, so nothing vanishes under a
    // finger that is about to tap Undo.
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    dragStartRef.current = event.clientY;
    dragYRef.current = 0;
    pauseTimer();
  };

  const handlePointerMove = (event) => {
    if (dragStartRef.current == null) return;
    const offset = Math.min(0, event.clientY - dragStartRef.current);
    dragYRef.current = offset;
    if (offset < 0) setDragging(true);
    setDragY(offset);
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
    if (dragYRef.current <= -SWIPE_UP_PX) {
      // Flicked away: the exit animation picks up from where the finger let go.
      dismiss();
      return;
    }
    dragYRef.current = 0;
    setDragging(false);
    setDragY(0);
    resumeTimer();
  };

  const handlePointerCancel = () => {
    dragStartRef.current = null;
    dragYRef.current = 0;
    setDragging(false);
    setDragY(0);
    resumeTimer();
  };

  const type = TYPES[shown?.type] || TYPES.success;
  const { Icon } = type;
  const isError = shown?.type === "error";
  const action = shown && shown.onAction && !actionExpired ? shown : null;

  return (
    <div
      // Never in the way of the app underneath; the card itself carries the
      // live region, so what is announced is exactly what is on screen.
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      {shown && (
        <div
          role={isError ? "alert" : "status"}
          aria-atomic="true"
          onAnimationEnd={() => setEntered(true)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            touchAction: "none",
            transform: dragging ? `translateY(${dragY}px)` : undefined,
            "--toast-from": `translateY(${dragY}px)`,
          }}
          className={`pointer-events-auto relative mx-auto flex w-full max-w-[440px] items-center gap-3 overflow-hidden rounded-2xl border bg-[#171923]/95 px-3 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur ${type.border} ${
            closing ? "toast-leave" : entered ? "" : "toast-enter"
          }`}
        >
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${type.circle}`}>
            <Icon size={16} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{shown.message}</p>
          {action && (
            <button
              type="button"
              onClick={() => { const act = action.onAction; dismiss(); act(); }}
              className="h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-indigo-300 active:opacity-70"
            >
              {action.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/70 active:opacity-70"
          >
            <X size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
          {shown.duration != null && (
            <span
              aria-hidden="true"
              className={`toast-progress absolute inset-x-0 bottom-0 h-[3px] ${type.bar}`}
              style={{ animationDuration: `${shown.duration}ms`, animationPlayState: paused ? "paused" : "running" }}
            />
          )}
        </div>
      )}
    </div>
  );
}