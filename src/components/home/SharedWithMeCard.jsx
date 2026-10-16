import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Users } from "lucide-react";
import { useAppState } from "@/lib/AppState";

/**
 * The way into the records other people have shared with this account. It is on
 * Home only while at least one share is live — the list itself is read from the
 * backend, which returns nothing the moment access is revoked.
 */
export default function SharedWithMeCard() {
  const { sharedWithMe } = useAppState();
  if (!sharedWithMe.length) return null;

  const names = sharedWithMe.map((share) => share.owner_name).join(", ");
  return (
    <Link
      to="/shared-with-me"
      className="mx-3 mb-4 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
        <Users size={16} className="text-indigo-500 dark:text-indigo-400" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-700 dark:text-gray-300">Shared with me</p>
        <p className="truncate text-sm text-gray-500 dark:text-[#9A9DAE]">
          {sharedWithMe.length === 1
            ? `${names} shared their records with you`
            : `${sharedWithMe.length} people shared their records with you`}
        </p>
      </div>
      <ChevronRight size={18} className="flex-shrink-0 text-gray-400" aria-hidden="true" />
    </Link>
  );
}