import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import { useAppState } from "@/lib/AppState";
import DateInput from "@/components/DateInput";
import ProfileCard from "@/components/profile/ProfileCard";
import { DATE_FIELD, FIELD, FIELD_ERROR, HINT, LABEL } from "@/components/profile/profileFields";

/**
 * Who the person is: the name that goes on the report they share, and the date
 * of birth the account's age check is made with. Nothing else belongs here — the
 * app's own options live in Settings.
 */

/** The age a date of birth gives today, or null when it is not a real date. */
function ageOn(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const birth = new Date(y, mo - 1, d);
  const real =
    birth.getFullYear() === y && birth.getMonth() === mo - 1 && birth.getDate() === d;
  if (!real || birth > new Date()) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() - (mo - 1);
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
  return age;
}

export default function DetailsCard() {
  const { profile, setProfile } = useAppState();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile?.first_name || "");
    setDob(profile?.birthdate || "");
  }, [profile?.first_name, profile?.birthdate]);

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const commitName = async () => {
    const next = name.trim();
    if (next === (profile?.first_name || "")) return;
    await setProfile({ ...profile, first_name: next });
    flashSaved();
  };

  // A date of birth is written once it is a whole, real date that puts the person
  // at 18 or over — the same rule onboarding applies. A cleared field simply
  // keeps the saved date, rather than quietly wiping it.
  const handleDob = async (value) => {
    setDob(value);
    setError("");
    if (!value) return;
    const age = ageOn(value);
    if (age == null) { setError("Enter a complete date."); return; }
    if (age < 18) { setError("You must be 18 or over to use Levli."); return; }
    if (value === (profile?.birthdate || "")) return;
    await setProfile({ ...profile, birthdate: value });
    flashSaved();
  };

  return (
    <ProfileCard icon={User} title="Your details" saved={saved}>
      <label className={LABEL} htmlFor="profile-name">Name</label>
      <input
        id="profile-name"
        type="text"
        value={name}
        placeholder="Your name"
        autoComplete="name"
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        className={FIELD}
      />
      <p className={HINT}>The name shown on the report you share with your doctor.</p>

      <label className={`${LABEL} mt-4`} htmlFor="profile-birthdate">Date of birth</label>
      <DateInput
        id="profile-birthdate"
        value={dob}
        fieldClass={DATE_FIELD}
        onChange={handleDob}
      />
      {error
        ? <p className={FIELD_ERROR}>{error}</p>
        : <p className={HINT}>Used to confirm you are 18 or over.</p>}
    </ProfileCard>
  );
}