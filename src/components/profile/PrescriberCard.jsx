import React, { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import ProfileCard from "@/components/profile/ProfileCard";
import { FIELD, HINT, LABEL } from "@/components/profile/profileFields";

/**
 * Who prescribes for the person. This is the one place a prescriber is entered:
 * every medication regimen and the "Contact prescriber" button read it from here.
 */
export default function PrescriberCard() {
  const { profile, setProfile } = useAppState();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile?.prescriber_name || "");
    setContact(profile?.prescriber_contact || "");
  }, [profile?.prescriber_name, profile?.prescriber_contact]);

  const commit = async () => {
    const nextName = name.trim();
    const nextContact = contact.trim();
    if (nextName === (profile?.prescriber_name || "") && nextContact === (profile?.prescriber_contact || "")) return;
    await setProfile({ ...profile, prescriber_name: nextName, prescriber_contact: nextContact });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ProfileCard icon={Stethoscope} title="Prescriber" saved={saved}>
      <label className={LABEL} htmlFor="prescriber-name">Name (optional)</label>
      <input
        id="prescriber-name"
        type="text"
        value={name}
        placeholder="Dr Patel"
        autoComplete="off"
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        className={FIELD}
      />

      <label className={`${LABEL} mt-4`} htmlFor="prescriber-contact">Phone or email (optional)</label>
      <input
        id="prescriber-contact"
        type="text"
        inputMode="email"
        value={contact}
        placeholder="Phone or email"
        autoComplete="off"
        onChange={(e) => setContact(e.target.value)}
        onBlur={commit}
        className={FIELD}
      />

      <p className={HINT}>
        Used by the "Contact prescriber" button when a dose is overdue or you've had a longer break.
      </p>
    </ProfileCard>
  );
}