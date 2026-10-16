import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, X } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import { dismissSharedShortcut, undismissedShares } from "@/lib/sharedAccess";
import CardTitleRow from "@/components/home/CardTitleRow";
import { CARD } from "@/lib/cardStyles";

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
      <Link to="/shared-with-me" className={`${CARD} block p-4 pr-12`}>
        <CardTitleRow
          icon={<Users size={16} className="text-indigo-500 dark:text-indigo-400" />}
          label="Shared with me"
          sub={line}
        />
      </Link>

      {/* The one action on the row, held on the same centre line as its icon and
          title. */}
      <button
        type="button"
        onClick={hide}
        aria-label="Hide the Shared with me shortcut"
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 active:scale-95"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}