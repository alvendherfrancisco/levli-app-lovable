import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, X } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { dismissSharedShortcut, undismissedShares } from "@/lib/sharedAccess";

/**
 * The Home shortcut to the records other people have shared with this account:
 * one slim row, shown only while somebody has shared something and the row has
 * not been put away on this device. Tapping it opens the shared records; the X
 * hides only the shortcut, never the access itself, which stays a tap away on
 * the More screen.
 *
 * The shares themselves are read from the backend, which returns nothing the
 * moment access is revoked — so the row is also the app's own answer to whether
 * anything is still shared with this person.
 *
 * It sits in the same gutter and wears the same radius as the other Home cards
 * (the Next shot card and the stats grid both keep 16px at the sides).
 */
export default function SharedWithMeCard() {
  const { sharedWithMe } = useAppState();
  const [hidden, setHidden] = useState(false);
  // Which shares are still worth showing, read once per change to the list.
  const shares = useMemo(() => undismissedShares(sharedWithMe), [sharedWithMe]);
  if (hidden || !shares.length) return null;

  const names = shares.map((share) => share.owner_name).join(", ");
  const line = shares.length === 1
    ? `${names} shared their records with you`
    : `${shares.length} people shared their records with you`;

  const hide = () => {
    dismissSharedShortcut(shares[0].id);
    setHidden(true);
  };

  return (
    <div className="relative mx-4 mb-4">
      <Link
        to="/shared-with-me"
        className="card-line flex items-center gap-2.5 rounded-2xl bg-white py-3 pl-3.5 pr-10 dark:bg-gray-900"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
          <Users size={15} className="text-indigo-500 dark:text-indigo-400" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Shared with me</span>
          <span className="block truncate text-xs text-gray-500 dark:text-[#9A9DAE]">{line}</span>
        </span>
      </Link>

      <button
        type="button"
        onClick={hide}
        aria-label="Hide the Shared with me shortcut"
        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 active:scale-95"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}