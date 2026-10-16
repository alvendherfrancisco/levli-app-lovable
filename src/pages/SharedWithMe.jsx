import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyStateCard from "@/components/EmptyStateCard";
import SharedPersonSwitch from "@/components/caregiver/SharedPersonSwitch";
import WeightReadOnlyCard from "@/components/caregiver/WeightReadOnlyCard";
import ShotsReadOnlyCard from "@/components/caregiver/ShotsReadOnlyCard";
import JournalReadOnlyCard from "@/components/caregiver/JournalReadOnlyCard";
import SideEffectsReadOnlyCard from "@/components/caregiver/SideEffectsReadOnlyCard";
import { fetchSharedRecords, listSharedWithMe, scopeLabel } from "@/lib/caregiverShare";
import { kgOfEntry } from "@/lib/measure";

const Loading = () => (
  <div className="flex justify-center py-10">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800 dark:border-gray-700 dark:border-t-gray-300" />
  </div>
);

/**
 * The caregiver's screen: whose records they can see, and those records.
 *
 * Both lists come from the backend, which is also what decides access — an invite
 * that is pending, expired or revoked returns nothing at all, so revoking access
 * takes it away from here on the next load. Nothing on this screen writes: the
 * records are shown as they were logged, with no edit, add or delete control
 * anywhere in them.
 */
export default function SharedWithMe() {
  const [shares, setShares] = useState(null);
  const [activeId, setActiveId] = useState("");
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    listSharedWithMe()
      .then((rows) => { setShares(rows); setActiveId(rows[0]?.id || ""); })
      .catch(() => { setShares([]); setMessage("The records shared with you could not be loaded."); });
  }, []);

  useEffect(() => {
    if (!activeId) return undefined;
    let live = true;
    setData(null);
    setMessage("");
    fetchSharedRecords(activeId)
      .then((res) => { if (live && res?.person) setData(res); })
      .catch(() => { if (live) setMessage("This access is no longer available."); });
    return () => { live = false; };
  }, [activeId]);

  const person = data?.person;
  const unit = person?.weight_unit || "lb";
  // The stored weights are canonical kilograms (older entries keep the unit they
  // were typed in), read here in the unit the person who logged them chose.
  const weights = (data?.weight || [])
    .map((row) => ({ id: row.id, day: row.day_key, kg: kgOfEntry(row, unit) }))
    .filter((row) => row.kg != null)
    .sort((a, b) => String(a.day).localeCompare(String(b.day)));
  const chosen = shares?.find((share) => share.id === activeId);

  return (
    <PageContainer className="min-h-screen w-full bg-white dark:bg-gray-950">
      <ScreenHeader title="Shared with me" subtitle="Records others have shared with you" />

      <div className="mx-auto w-full max-w-3xl pt-2">
        {shares === null ? (
          <Loading />
        ) : shares.length === 0 ? (
          <EmptyStateCard
            className="mx-3"
            icon={Users}
            title="Nothing shared yet"
            description={message || "When someone invites you to see their records, they appear here."}
          />
        ) : (
          <>
            <div className="mx-3 mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-500/25 dark:bg-indigo-500/10">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Viewing {person?.name || chosen?.owner_name || "their"} records (read only)
              </p>
              <p className="mt-0.5 text-xs text-indigo-600/90 dark:text-indigo-300/75">
                {scopeLabel(person?.scope || chosen?.scope)}. They can revoke this access at any time.
              </p>
            </div>

            <SharedPersonSwitch shares={shares} activeId={activeId} onSelect={setActiveId} />

            {message && <p className="mx-3 mb-4 text-sm text-gray-500 dark:text-[#9A9DAE]">{message}</p>}
            {!data && !message && <Loading />}

            {data && (
              <>
                <WeightReadOnlyCard entries={weights} unit={unit} goalKg={person.goal_weight_kg} />
                <ShotsReadOnlyCard shots={data.shots || []} />
                <JournalReadOnlyCard entries={data.journal || []} />
                {/* The side-effects section follows the owner's plan, exactly as the
                    Insights cards do for them. */}
                <SideEffectsReadOnlyCard events={data.side_effects || []} locked={!person?.is_premium} />
                <p className="mx-3 pb-2 text-xs text-gray-400 dark:text-gray-500">
                  These records belong to {person.name} and are shown read only.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}