import { useState } from "react";
import { loadProfile, saveProfile } from "../birth.js";
import BirthForm from "./BirthForm.jsx";
import Ticker from "./Ticker.jsx";

// First visit: ask for birth details. After that: show the ticker, with a link to change them.
export default function Travel() {
  const [profile, setProfile] = useState(loadProfile);
  const [editing, setEditing] = useState(false);

  if (!profile || editing) {
    return (
      <BirthForm
        initial={profile}
        onSave={(p) => { saveProfile(p); setProfile(p); setEditing(false); }}
        onCancel={profile ? () => setEditing(false) : null}
      />
    );
  }
  return <Ticker profile={profile} onEdit={() => setEditing(true)} />;
}
